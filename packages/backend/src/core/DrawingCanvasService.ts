/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { Like } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { bindThis } from '@/decorators.js';
import { DriveService } from '@/core/DriveService.js';
import { ChatService } from '@/core/ChatService.js';
import type { MiUser, MiChatRoom, DriveFilesRepository, ChatRoomsRepository } from '@/models/_.js';
import type { GlobalEvents } from '@/core/GlobalEventService.js';

interface DrawingStroke {
	id: string; // ストロークの一意ID
	userId: string;
	userName: string;
	points: Array<{ x: number; y: number }>;
	tool: 'pen' | 'eraser' | 'eyedropper';
	color: string;
	strokeWidth: number;
	opacity: number;
	timestamp: number;
}

interface CanvasData {
	strokes: DrawingStroke[];
	lastActivity: number;
	participants: Set<string>;
}

@Injectable()
export class DrawingCanvasService {
	private readonly CANVAS_EXPIRY = 7 * 24 * 60 * 60; // 7日間（秒）
	private readonly AUTO_SAVE_THRESHOLD = 30 * 60 * 1000; // 30分間非アクティブで自動保存（ミリ秒）
	private readonly canvasCache = new Map<string, CanvasData>();
	private readonly saveTimers = new Map<string, NodeJS.Timeout>();

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.chatRoomsRepository)
		private chatRoomsRepository: ChatRoomsRepository,

		private driveService: DriveService,
		private chatService: ChatService,
	) {
		// 定期的な自動保存チェック（5分間隔）
		setInterval(() => {
			this.checkAutoSave();
		}, 5 * 60 * 1000);
	}

	@bindThis
	private getCanvasKey(roomId: string): string {
		return `drawing:canvas:${roomId}`;
	}

	@bindThis
	private getMetaKey(roomId: string): string {
		return `drawing:meta:${roomId}`;
	}

	@bindThis
	private getUndoBufferKey(roomId: string, userId: string): string {
		return `drawing:undo:${roomId}:${userId}`;
	}

	// ユーザー間チャットIDかどうかを判定
	private isUserToUserChatId(drawingId: string): boolean {
		return drawingId.startsWith('user-') && drawingId.split('-').length === 3;
	}

	// 描画アクセス権限をチェック
	@bindThis
	public async canUserAccessCanvas(drawingId: string, userId: string): Promise<boolean> {
		try {
			if (this.isUserToUserChatId(drawingId)) {
				// user-userId1-userId2 形式の場合
				const parts = drawingId.split('-');
				if (parts.length === 3) {
					const [, userId1, userId2] = parts;
					// 自分がいずれかのユーザーに含まれているかチェック
					return userId === userId1 || userId === userId2;
				}
				return false;
			} else {
				// 通常のルームIDの場合
				const room = await this.chatService.findRoomById(drawingId);
				if (!room) return false;
				return await this.chatService.isRoomMember(room, userId);
			}
		} catch (error) {
			console.error('Canvas access check failed:', error);
			return false;
		}
	}

	@bindThis
	public async addStroke(roomId: string, stroke: DrawingStroke): Promise<void> {
		try {
			// Redisにストロークを追加
			const canvasKey = this.getCanvasKey(roomId);
			const metaKey = this.getMetaKey(roomId);

			await this.redisClient.lpush(canvasKey, JSON.stringify(stroke));
			await this.redisClient.expire(canvasKey, this.CANVAS_EXPIRY);

			// メタデータ更新
			const metaData = {
				lastActivity: Date.now(),
				participantCount: await this.redisClient.scard(`${metaKey}:participants`),
			};

			await this.redisClient.sadd(`${metaKey}:participants`, stroke.userId);
			await this.redisClient.hmset(metaKey, metaData);
			await this.redisClient.expire(metaKey, this.CANVAS_EXPIRY);

			// ユーザー別アンドゥバッファに追加（最新10ストロークを保持）
			const undoBufferKey = this.getUndoBufferKey(roomId, stroke.userId);
			await this.redisClient.lpush(undoBufferKey, JSON.stringify(stroke));
			await this.redisClient.ltrim(undoBufferKey, 0, 9); // 最新10ストロークのみ保持
			await this.redisClient.expire(undoBufferKey, this.CANVAS_EXPIRY);

			// ローカルキャッシュ更新
			this.updateLocalCache(roomId, stroke);

			// 自動保存タイマーをリセット
			this.resetAutoSaveTimer(roomId);

			console.log(`🎨 [DEBUG] Added stroke to canvas ${roomId} by user ${stroke.userId}`);
		} catch (error) {
			console.error(`🎨 [ERROR] Failed to add stroke to canvas ${roomId}:`, error);
		}
	}

	@bindThis
	public async clearCanvas(roomId: string, userId: string): Promise<void> {
		try {
			const canvasKey = this.getCanvasKey(roomId);
			const metaKey = this.getMetaKey(roomId);

			// Redisからキャンバスデータを削除
			await this.redisClient.del(canvasKey);
			await this.redisClient.del(`${metaKey}:participants`);

			// メタデータ更新
			const metaData = {
				lastActivity: Date.now(),
				clearedBy: userId,
				clearedAt: Date.now(),
			};
			await this.redisClient.hmset(metaKey, metaData);
			await this.redisClient.expire(metaKey, this.CANVAS_EXPIRY);

			// ローカルキャッシュ削除
			this.canvasCache.delete(roomId);

			// 自動保存タイマーをリセット
			this.resetAutoSaveTimer(roomId);

			console.log(`🎨 [DEBUG] Canvas ${roomId} cleared by user ${userId}`);
		} catch (error) {
			console.error(`🎨 [ERROR] Failed to clear canvas ${roomId}:`, error);
		}
	}

	@bindThis
	public async getCanvasData(roomId: string): Promise<DrawingStroke[]> {
		try {
			// まずRedisから確認
			const canvasKey = this.getCanvasKey(roomId);
			const strokesData = await this.redisClient.lrange(canvasKey, 0, -1);

			if (strokesData.length > 0) {
				// Redisにデータがある場合
				const strokes: DrawingStroke[] = strokesData
					.map(data => {
						try {
							return JSON.parse(data) as DrawingStroke;
						} catch {
							return null;
						}
					})
					.filter((stroke): stroke is DrawingStroke => stroke !== null)
					.reverse(); // 最新が最後になるように逆順

				console.log(`🎨 [DEBUG] Retrieved ${strokes.length} strokes from Redis for canvas ${roomId}`);
				return strokes;
			}

			// Redisにデータがない場合、Driveから最新のファイルを検索して復元
			console.log(`🎨 [DEBUG] No Redis data found, searching Drive for canvas ${roomId}`);
			return await this.loadCanvasFromDrive(roomId);
		} catch (error) {
			console.error(`🎨 [ERROR] Failed to get canvas data for ${roomId}:`, error);
			return [];
		}
	}

	@bindThis
	private async loadCanvasFromDrive(roomId: string): Promise<DrawingStroke[]> {
		try {
			// ルーム情報を取得してオーナーを特定
			const room = await this.chatRoomsRepository.findOneBy({ id: roomId });
			if (!room) {
				console.warn(`🎨 [WARN] Room ${roomId} not found for Drive loading`);
				return [];
			}

			// 最新のキャンバスファイルを検索
			const latestCanvasFile = await this.driveFilesRepository.findOne({
				where: {
					userId: room.ownerId,
					name: Like(`drawing-${roomId}-%`),
					comment: Like(`%お絵かきキャンバス - ルーム ${roomId}%`),
				},
				order: { id: 'DESC' },
			});

			if (!latestCanvasFile) {
				console.log(`🎨 [DEBUG] No previous canvas file found for room ${roomId}`);
				return [];
			}

			console.log(`🎨 [DEBUG] Found previous canvas file ${latestCanvasFile.id} for room ${roomId}`);

			// JSONファイルからストロークデータを復元
			if (latestCanvasFile.type === 'application/json') {
				// ファイル内容を読み込み
				// TODO: DriveServiceにgetFileContentメソッドを実装する必要があります
				console.warn(`🎨 [WARN] Drive file reading not implemented yet for room ${roomId}`);
				const fileContent = null; // await this.driveService.getFileContent(latestCanvasFile.id);
				if (fileContent) {
					const strokesData = JSON.parse(fileContent.toString());

					// Redisに復元データを保存（一時的に）
					const canvasKey = this.getCanvasKey(roomId);
					const pipeline = this.redisClient.pipeline();

					for (const stroke of strokesData) {
						pipeline.lpush(canvasKey, JSON.stringify(stroke));
					}

					pipeline.expire(canvasKey, this.CANVAS_EXPIRY);
					await pipeline.exec();

					console.log(`🎨 [DEBUG] Restored ${strokesData.length} strokes from Drive to Redis for room ${roomId}`);
					return strokesData;
				}
			}

			return [];
		} catch (error) {
			console.error(`🎨 [ERROR] Failed to load canvas from Drive for room ${roomId}:`, error);
			return [];
		}
	}

	@bindThis
	private updateLocalCache(roomId: string, stroke: DrawingStroke): void {
		if (!this.canvasCache.has(roomId)) {
			this.canvasCache.set(roomId, {
				strokes: [],
				lastActivity: Date.now(),
				participants: new Set(),
			});
		}

		const canvasData = this.canvasCache.get(roomId)!;
		canvasData.strokes.push(stroke);
		canvasData.lastActivity = Date.now();
		canvasData.participants.add(stroke.userId);

		// メモリ使用量制限（1000ストローク）
		if (canvasData.strokes.length > 1000) {
			canvasData.strokes = canvasData.strokes.slice(-1000);
		}
	}

	@bindThis
	private resetAutoSaveTimer(roomId: string): void {
		// 既存のタイマーをクリア
		const existingTimer = this.saveTimers.get(roomId);
		if (existingTimer) {
			clearTimeout(existingTimer);
		}

		// 新しいタイマーを設定
		const timer = setTimeout(() => {
			this.autoSaveCanvas(roomId);
		}, this.AUTO_SAVE_THRESHOLD);

		this.saveTimers.set(roomId, timer);
	}

	@bindThis
	private async checkAutoSave(): Promise<void> {
		const now = Date.now();

		// Redisからすべてのキャンバスメタデータを取得
		const pattern = 'drawing:meta:*';
		const keys = await this.redisClient.keys(pattern);

		for (const metaKey of keys) {
			try {
				const roomId = metaKey.replace('drawing:meta:', '');
				const metaData = await this.redisClient.hgetall(metaKey);

				if (metaData.lastActivity) {
					const lastActivity = parseInt(metaData.lastActivity);
					if (now - lastActivity > this.AUTO_SAVE_THRESHOLD) {
						await this.autoSaveCanvas(roomId);
					}
				}
			} catch (error) {
				console.error(`🎨 [ERROR] Failed to check auto save for ${metaKey}:`, error);
			}
		}
	}

	@bindThis
	private async autoSaveCanvas(roomId: string): Promise<void> {
		try {
			console.log(`🎨 [DEBUG] Auto-saving canvas ${roomId} due to inactivity`);

			// キャンバスデータを取得
			const strokes = await this.getCanvasData(roomId);
			if (strokes.length === 0) {
				console.log(`🎨 [DEBUG] No strokes to save for canvas ${roomId}`);
				return;
			}

			// ルーム情報を取得
			const room = await this.chatRoomsRepository.findOneBy({ id: roomId });
			if (!room) {
				console.warn(`🎨 [WARN] Room ${roomId} not found for auto-save`);
				return;
			}

			// キャンバスを画像として生成・保存
			await this.saveCanvasToImage(roomId, strokes, room.ownerId);

			// Redisからキャンバスデータを削除（保存後クリーンアップ）
			await this.cleanupCanvasData(roomId);

			console.log(`🎨 [DEBUG] Successfully auto-saved canvas ${roomId}`);
		} catch (error) {
			console.error(`🎨 [ERROR] Failed to auto-save canvas ${roomId}:`, error);
		}
	}

	@bindThis
	private async saveCanvasToImage(roomId: string, strokes: DrawingStroke[], ownerId: string): Promise<void> {
		try {
			// JSONとSVGの両方で保存
			const timestamp = Date.now();

			// 1. JSONファイルとして保存（復元用）
			const jsonData = JSON.stringify(strokes, null, 2);
			const jsonFilename = `drawing-${roomId}-${timestamp}.json`;
			const jsonBuffer = Buffer.from(jsonData, 'utf-8');

			const jsonFile = await this.driveService.addFile({
				user: { id: ownerId } as MiUser,
				path: jsonFilename,
				name: jsonFilename,
				// buffer: jsonBuffer, // TODO: AddFileArgsにbufferパラメータを追加する必要があります
				type: 'application/json',
				isPrivate: false,
				folder: null,
				uri: null,
				sensitive: false,
				comment: `お絵かきキャンバス - ルーム ${roomId}`,
			} as any);

			// 2. SVGファイルとしても保存（表示用）
			const svgContent = this.generateSVGFromStrokes(strokes);
			const svgFilename = `drawing-${roomId}-${timestamp}.svg`;
			const svgBuffer = Buffer.from(svgContent, 'utf-8');

			const svgFile = await this.driveService.addFile({
				user: { id: ownerId } as MiUser,
				path: svgFilename,
				name: svgFilename,
				// buffer: svgBuffer, // TODO: AddFileArgsにbufferパラメータを追加する必要があります
				type: 'image/svg+xml',
				isPrivate: false,
				folder: null,
				uri: null,
				sensitive: false,
				comment: `お絵かきキャンバス表示用 - ルーム ${roomId}`,
			} as any);

			console.log(`🎨 [DEBUG] Canvas saved as JSON (${jsonFile.id}) and SVG (${svgFile.id}) for room ${roomId}`);
		} catch (error) {
			console.error(`🎨 [ERROR] Failed to save canvas files:`, error);
		}
	}

	@bindThis
	private generateSVGFromStrokes(strokes: DrawingStroke[]): string {
		const width = 800;
		const height = 600;

		let pathElements = '';

		for (const stroke of strokes) {
			if (stroke.tool === 'pen' && stroke.points.length > 0) {
				const pathData = stroke.points.map((point, index) => {
					return index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`;
				}).join(' ');

				pathElements += `<path d="${pathData}" stroke="${stroke.color}" stroke-width="${stroke.strokeWidth}" stroke-opacity="${stroke.opacity}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
			}
		}

		return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
	<rect width="100%" height="100%" fill="white"/>
	${pathElements}
	<text x="10" y="${height - 10}" font-family="Arial" font-size="12" fill="#888">Generated: ${new Date().toISOString()}</text>
</svg>`;
	}

	@bindThis
	private async cleanupCanvasData(roomId: string): Promise<void> {
		try {
			const canvasKey = this.getCanvasKey(roomId);
			const metaKey = this.getMetaKey(roomId);

			await this.redisClient.del(canvasKey);
			await this.redisClient.del(`${metaKey}:participants`);
			await this.redisClient.del(metaKey);

			// ローカルキャッシュとタイマーもクリア
			this.canvasCache.delete(roomId);
			const timer = this.saveTimers.get(roomId);
			if (timer) {
				clearTimeout(timer);
				this.saveTimers.delete(roomId);
			}

			console.log(`🎨 [DEBUG] Cleaned up canvas data for room ${roomId}`);
		} catch (error) {
			console.error(`🎨 [ERROR] Failed to cleanup canvas data for ${roomId}:`, error);
		}
	}

	@bindThis
	public async forceServerCanvasData(roomId: string): Promise<void> {
		console.log(`🎨 [DEBUG] Force saving canvas data for room ${roomId}`);
		await this.autoSaveCanvas(roomId);
	}

	@bindThis
	public async performUndo(roomId: string, userId: string): Promise<DrawingStroke | null> {
		try {
			const undoBufferKey = this.getUndoBufferKey(roomId, userId);

			// ユーザーのアンドゥバッファから最新のストロークを取得
			const latestStrokeData = await this.redisClient.lpop(undoBufferKey);

			if (!latestStrokeData) {
				console.log(`🎨 [DEBUG] No strokes to undo for user ${userId} in room ${roomId}`);
				return null;
			}

			const strokeToUndo: DrawingStroke = JSON.parse(latestStrokeData);
			console.log(`🎨 [DEBUG] Undoing stroke ${strokeToUndo.id} for user ${userId} in room ${roomId}`);

			// メインキャンバスからも該当ストロークを削除
			await this.removeStrokeFromCanvas(roomId, strokeToUndo.id);

			return strokeToUndo;
		} catch (error) {
			console.error(`🎨 [ERROR] Failed to perform undo for user ${userId} in room ${roomId}:`, error);
			return null;
		}
	}

	@bindThis
	private async removeStrokeFromCanvas(roomId: string, strokeId: string): Promise<void> {
		try {
			const canvasKey = this.getCanvasKey(roomId);

			// 全てのストロークを取得
			const allStrokes = await this.redisClient.lrange(canvasKey, 0, -1);

			// 削除対象以外のストロークをフィルタリング
			const filteredStrokes = allStrokes.filter(strokeData => {
				try {
					const stroke = JSON.parse(strokeData);
					return stroke.id !== strokeId;
				} catch {
					return true; // パースエラーの場合は保持
				}
			});

			// Redisリストを再構築
			await this.redisClient.del(canvasKey);
			if (filteredStrokes.length > 0) {
				await this.redisClient.lpush(canvasKey, ...filteredStrokes.reverse());
				await this.redisClient.expire(canvasKey, this.CANVAS_EXPIRY);
			}

			console.log(`🎨 [DEBUG] Removed stroke ${strokeId} from canvas ${roomId}`);
		} catch (error) {
			console.error(`🎨 [ERROR] Failed to remove stroke ${strokeId} from canvas ${roomId}:`, error);
		}
	}

	// アプリケーション終了時のクリーンアップ
	@bindThis
	public async onApplicationShutdown(): Promise<void> {
		console.log('🎨 [DEBUG] DrawingCanvasService shutting down, clearing timers...');

		// すべてのタイマーをクリア
		for (const timer of this.saveTimers.values()) {
			clearTimeout(timer);
		}
		this.saveTimers.clear();
	}
}