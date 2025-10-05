/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as Redis from 'ioredis';
import { Like } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { bindThis } from '@/decorators.js';
import { DriveService } from '@/core/DriveService.js';
import { ChatService } from '@/core/ChatService.js';
import type { MiUser, MiChatRoom, DriveFilesRepository, ChatRoomsRepository } from '@/models/_.js';
import type { GlobalEvents } from '@/core/GlobalEventService.js';

interface DrawingPoint {
	x: number;
	y: number;
	pressure?: number;
}

interface DrawingStroke {
	id: string; // ストロークの一意ID
	userId: string;
	userName: string;
	points: DrawingPoint[];
	tool: 'pen' | 'eraser' | 'eyedropper';
	color: string;
	strokeWidth: number;
	opacity: number;
	timestamp: number;
	layer: number;
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
	private readonly MAX_LAYER_INDEX = 2;
	private readonly MAX_POINTS_PER_STROKE = 1024;
	private readonly MAX_COORDINATE = 4000;
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
			const normalizedStroke: DrawingStroke = {
				...stroke,
				layer: this.clampLayerIndex(stroke.layer),
				points: stroke.points.map(point => ({
					x: this.clampCoordinate(point.x),
					y: this.clampCoordinate(point.y),
					pressure: typeof point.pressure === 'number' ? Math.min(Math.max(point.pressure, 0), 1) : undefined,
				})),
			};
			// Redisにストロークを追加
			const canvasKey = this.getCanvasKey(roomId);
			const metaKey = this.getMetaKey(roomId);

			await this.redisClient.lpush(canvasKey, JSON.stringify(normalizedStroke));
			await this.redisClient.expire(canvasKey, this.CANVAS_EXPIRY);

			// メタデータ更新
			const metaData = {
				lastActivity: Date.now(),
				participantCount: await this.redisClient.scard(`${metaKey}:participants`),
			};

			await this.redisClient.sadd(`${metaKey}:participants`, normalizedStroke.userId);
			await this.redisClient.hmset(metaKey, metaData);
			await this.redisClient.expire(metaKey, this.CANVAS_EXPIRY);

			// ユーザー別アンドゥバッファに追加（最新10ストロークを保持）
			const undoBufferKey = this.getUndoBufferKey(roomId, normalizedStroke.userId);
			await this.redisClient.lpush(undoBufferKey, JSON.stringify(normalizedStroke));
			await this.redisClient.ltrim(undoBufferKey, 0, 9); // 最新10ストロークのみ保持
			await this.redisClient.expire(undoBufferKey, this.CANVAS_EXPIRY);

			// ローカルキャッシュ更新
			this.updateLocalCache(roomId, normalizedStroke);

			// 自動保存タイマーをリセット
			this.resetAutoSaveTimer(roomId);

			console.log(`🎨 [DEBUG] Added stroke to canvas ${roomId} by user ${normalizedStroke.userId}`);
		} catch (error) {
			console.error(`🎨 [ERROR] Failed to add stroke to canvas ${roomId}:`, error);
		}
	}

	public getMaxLayerIndex(): number {
		return this.MAX_LAYER_INDEX;
	}

	@bindThis
	public normalizeStrokeData(roomId: string, user: Pick<MiUser, 'id' | 'username' | 'name'>, payload: any): DrawingStroke | null {
		if (!payload || typeof payload !== 'object') {
			console.warn(`🎨 [WARN] Invalid stroke payload received for ${roomId}`);
			return null;
		}

		const rawPoints = Array.isArray(payload.points) ? payload.points : null;
		if (!rawPoints || rawPoints.length === 0 || rawPoints.length > this.MAX_POINTS_PER_STROKE) {
			console.warn(`🎨 [WARN] Stroke points not valid for ${roomId}`);
			return null;
		}

		const points: DrawingPoint[] = [];
		for (const point of rawPoints) {
			if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
				console.warn(`🎨 [WARN] Stroke point missing coordinates for ${roomId}`);
				return null;
			}

			const normalizedPoint: DrawingPoint = {
				x: this.clampCoordinate(point.x),
				y: this.clampCoordinate(point.y),
			};

			if (typeof point.pressure === 'number' && Number.isFinite(point.pressure)) {
				normalizedPoint.pressure = Math.min(Math.max(point.pressure, 0), 1);
			}

			points.push(normalizedPoint);
		}

		const allowedTools: Array<DrawingStroke['tool']> = ['pen', 'eraser', 'eyedropper'];
		const tool: DrawingStroke['tool'] = allowedTools.includes(payload.tool) ? payload.tool : 'pen';
		if (tool === 'eyedropper') {
			console.warn(`🎨 [WARN] Ignoring eyedropper stroke for ${roomId}`);
			return null;
		}

		if (typeof payload.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(payload.color)) {
			console.warn(`🎨 [WARN] Stroke color invalid for ${roomId}`);
			return null;
		}

		if (typeof payload.strokeWidth !== 'number' || !Number.isFinite(payload.strokeWidth)) {
			console.warn(`🎨 [WARN] Stroke width invalid for ${roomId}`);
			return null;
		}
		const strokeWidth = Math.min(Math.max(payload.strokeWidth, 1), 100);

		if (typeof payload.opacity !== 'number' || !Number.isFinite(payload.opacity)) {
			console.warn(`🎨 [WARN] Stroke opacity invalid for ${roomId}`);
			return null;
		}
		const opacity = Math.min(Math.max(payload.opacity, 0.05), 1);

		const layer = this.clampLayerIndex(payload.layer);
		const timestamp = typeof payload.timestamp === 'number' ? payload.timestamp : Date.now();

		return {
			id: typeof payload.id === 'string' ? payload.id : randomUUID(),
			userId: user.id,
			userName: user.username ?? user.name ?? 'Unknown',
			points,
			tool,
			color: payload.color,
			strokeWidth,
			opacity,
			timestamp,
			layer,
		};
	}

	private clampCoordinate(value: number): number {
		if (!Number.isFinite(value)) return 0;
		return Math.min(Math.max(value, 0), this.MAX_COORDINATE);
	}

	private clampLayerIndex(value: number): number {
		if (!Number.isFinite(value)) return 0;
		return Math.min(Math.max(Math.floor(value), 0), this.MAX_LAYER_INDEX);
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
				console.warn(`🎨 [WARN] Drive file reading not implemented yet for room ${roomId}`);
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

			// ユーザー間チャットかルームチャットかで処理を分岐
			if (this.isUserToUserChatId(roomId)) {
				// ユーザー間チャット: user-userId1-userId2 形式
				const parts = roomId.split('-');
				if (parts.length === 3) {
					const [, userId1, userId2] = parts;
					// 両ユーザーのDriveに保存
					await this.saveCanvasToImage(roomId, strokes, userId1);
					await this.saveCanvasToImage(roomId, strokes, userId2);
					console.log(`🎨 [DEBUG] Saved canvas ${roomId} to both users' Drives: ${userId1}, ${userId2}`);
				}
			} else {
				// ルームチャット: ルームオーナーのDriveに保存
				const room = await this.chatRoomsRepository.findOneBy({ id: roomId });
				if (!room) {
					console.warn(`🎨 [WARN] Room ${roomId} not found for auto-save`);
					return;
				}
				await this.saveCanvasToImage(roomId, strokes, room.ownerId);
			}

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