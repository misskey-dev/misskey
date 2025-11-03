/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import type { GlobalEvents } from '@/core/GlobalEventService.js';
import type { JsonObject } from '@/misc/json-value.js';
import { ChatService } from '@/core/ChatService.js';
import { DrawingCanvasService } from '@/core/DrawingCanvasService.js';
import { DI } from '@/di-symbols.js';
import type { ChatRoomsRepository } from '@/models/_.js';
import Channel, { type MiChannelService } from '../channel.js';

class ChatRoomChannel extends Channel {
	public readonly chName = 'chatRoom';
	public static shouldShare = false;
	public static requireCredential = true as const;
	public static kind = 'read:chat';
	private roomId: string;
	private typers: Record<string, Date> = {};
	private emitTypersIntervalId: ReturnType<typeof setInterval>;

	// レート制限用
	private lastDrawingStroke: number = 0;
	private lastCursorMove: number = 0;
	private drawingStrokeCount: number = 0;
	private cursorMoveCount: number = 0;

	constructor(
		private chatService: ChatService,
		private drawingCanvasService: DrawingCanvasService,
		private chatRoomsRepository: ChatRoomsRepository,

		id: string,
		connection: Channel['connection'],
	) {
		super(id, connection);
	}

	@bindThis
	public async init(params: JsonObject) {
		if (typeof params.roomId !== 'string') return;
		this.roomId = params.roomId;

		// セキュリティ: ルーム参加権限の確認
		if (!this.user) {
			console.warn(`🔍 [SECURITY] Unauthenticated user attempting to access room ${this.roomId}`);
			return;
		}

		try {
			// メンバーシップ確認（ルーム存在確認も含む）
			const room = await this.chatRoomsRepository.findOneBy({ id: this.roomId });
			if (!room) {
				console.warn(`🔍 [SECURITY] User ${this.user.id} attempting to access non-existent room ${this.roomId}`);
				return;
			}

			const isMember = await this.chatService.isRoomMember(room, this.user.id);
			if (!isMember) {
				console.warn(`🔍 [SECURITY] User ${this.user.id} denied access to room ${this.roomId} - not a member`);
				return;
			}

			console.log(`🔍 [DEBUG] User ${this.user.id} granted access to room ${this.roomId}`);
		} catch (error) {
			console.error(`🔍 [ERROR] Failed to verify room access for user ${this.user.id} to room ${this.roomId}:`, error);
			return;
		}

		// oranski方式の定期的なemitTypersは無効化
		// this.emitTypersIntervalId = setInterval(this.emitTypers, 5000);
		this.subscriber.on(`chatRoomStream:${this.roomId}`, this.onEvent);
	}

	@bindThis
	private async onEvent(data: GlobalEvents['chatRoom']['payload']) {
		// デバッグ: cursorMoveイベントの配信を確認
		if (data.type === 'cursorMove') {
			console.log(`🔍 [DEBUG] onEvent called for user ${this.user!.id}, event from user ${data.body.userId}`);
		}

		if (data.type === 'typing') {
			const userId = data.body.userId;
			const begin = this.typers[userId] == null;
			this.typers[userId] = new Date();
			// oranski方式のemitTypersは無効化し、個別イベントのみ使用
			// if (begin) {
			// 	this.emitTypers();
			// }
			// 個別typingイベントを送信
			this.send(data.type, data.body);
		} else if (data.type === 'typingStop') {
			const userId = data.body.userId;
			delete this.typers[userId];
			// oranski方式のemitTypersは無効化し、個別イベントのみ使用
			// this.emitTypers();
			// 個別typingStopイベントを送信
			this.send(data.type, data.body);
		} else {
			this.send(data.type, data.body);
		}
	}

	@bindThis
	public async onMessage(type: string, body: any) {
		console.log(`🔍 [DEBUG] ChatRoomChannel received message - type: ${type}, userId: ${this.user!.id}, roomId: ${this.roomId}`);

		// セキュリティ: ユーザー認証確認
		if (!this.user) {
			console.warn(`🔍 [SECURITY] Unauthenticated user attempting ${type} event`);
			return;
		}

		switch (type) {
			case 'read':
				if (this.roomId) {
					this.chatService.readRoomChatMessage(this.user.id, this.roomId);
				}
				break;
			case 'typing':
				console.log(`🔍 [DEBUG] Processing typing event for room ${this.roomId} from user ${this.user.id}`);

				// セキュリティ: クライアントから送信されたroomIdが認証済みチャンネルのroomIdと一致するか検証
				if (body?.roomId && body.roomId !== this.roomId) {
					console.warn(`🔍 [SECURITY] roomId mismatch in typing event: sent=${body.roomId}, expected=${this.roomId}, user=${this.user.id}`);
					return;
				}

				// セキュリティ: typing送信者を認証済みユーザーIDに強制設定
				if (this.roomId) {
					this.chatService.notifyRoomTyping(this.user.id, this.roomId);
				}
				break;
			case 'typingStop':
				console.log(`🔍 [DEBUG] Processing typingStop event for room ${this.roomId} from user ${this.user.id}`);

				// セキュリティ: クライアントから送信されたroomIdが認証済みチャンネルのroomIdと一致するか検証
				if (body?.roomId && body.roomId !== this.roomId) {
					console.warn(`🔍 [SECURITY] roomId mismatch in typingStop event: sent=${body.roomId}, expected=${this.roomId}, user=${this.user.id}`);
					return;
				}

				// セキュリティ: typingStop送信者を認証済みユーザーIDに強制設定
				if (this.roomId) {
					this.chatService.notifyRoomTypingStop(this.user.id, this.roomId);
				}
				break;
			case 'drawingStroke':
				console.log(`🔍 [DEBUG] Processing drawing stroke for room ${this.roomId} from user ${this.user.id}`);

				// レート制限: 10ms間隔制限 & 1秒間に100回まで（お絵かき用に緩和）
				const now = Date.now();
				if (now - this.lastDrawingStroke < 10) {
					console.warn(`🔍 [SECURITY] Drawing stroke rate limit exceeded by user ${this.user.id}`);
					return;
				}
				if (now - this.lastDrawingStroke < 1000) {
					this.drawingStrokeCount++;
					if (this.drawingStrokeCount > 100) {
						console.warn(`🔍 [SECURITY] Drawing stroke burst limit exceeded by user ${this.user.id}`);
						return;
					}
				} else {
					this.drawingStrokeCount = 1;
				}
				this.lastDrawingStroke = now;

			const strokeData = this.drawingCanvasService.normalizeStrokeData(this.roomId, this.user, body);
			if (!strokeData) {
				console.warn(`🔍 [SECURITY] Invalid drawing stroke payload rejected for room ${this.roomId}`);
				return;
			}

			await this.drawingCanvasService.addStroke(this.roomId, strokeData);

			await this.chatService.broadcastDrawingStroke(this.roomId, this.user.id, strokeData);
				break;
			case 'drawingProgress':
				console.log(`🔍 [DEBUG] Processing drawing progress for room ${this.roomId} from user ${this.user.id}`);

				// レート制限: 50ms間隔制限（進行状況は高頻度）
				const progressNow = Date.now();
				if (progressNow - this.lastDrawingStroke < 50) return; // 無言で制限（ログなし）
				this.lastDrawingStroke = progressNow;

				// セキュリティ: 描画データの詳細検証
				if (!body || typeof body !== 'object') return;
				if (!Array.isArray(body.points) || body.points.length === 0 || body.points.length > 500) return; // 進行中は点数制限緩和
				if (!['pen', 'eraser', 'eyedropper'].includes(body.tool)) return;
				if (typeof body.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(body.color)) return;
				if (typeof body.strokeWidth !== 'number' || body.strokeWidth < 1 || body.strokeWidth > 100) return;
				if (typeof body.opacity !== 'number' || body.opacity < 0.1 || body.opacity > 1) return;

				// 進行状況データ作成
			const maxLayer = this.drawingCanvasService.getMaxLayerIndex();
			const layerIndex = Math.min(Math.max(Math.floor(typeof body.layer === 'number' ? body.layer : 0), 0), maxLayer);
			const progressData = {
					userId: this.user.id,
					userName: this.user.name || this.user.username,
					points: body.points.map((p: any) => ({
					x: Math.min(Math.max(Math.round(p.x), 0), 4000),
					y: Math.min(Math.max(Math.round(p.y), 0), 4000),
						pressure: p.pressure !== undefined ? p.pressure : 1.0,
					})),
					tool: body.tool,
					color: body.color,
					strokeWidth: body.strokeWidth,
					opacity: body.opacity,
				layer: layerIndex,
					timestamp: progressNow,
				};

				// 描画進行状況をルーム内の他のユーザーに配信
			await this.chatService.broadcastDrawingProgress(this.roomId, this.user.id, progressData);
				break;
			case 'cursorMove':
				// レート制限: 50ms間隔制限（カーソルは高頻度）
				const cursorNow = Date.now();
				if (cursorNow - this.lastCursorMove < 50) return; // 無言で制限（ログなし）
				this.lastCursorMove = cursorNow;

				// セキュリティ: カーソル位置の検証（可変キャンバスサイズに対応）
				if (!body || typeof body.x !== 'number' || typeof body.y !== 'number') return;
				if (body.x < -100 || body.x > 4100 || body.y < -100 || body.y > 4100) return; // 最大4000x4000 + マージン

				// カーソル位置をルーム内の他のユーザーに配信
			await this.chatService.broadcastCursorMove(this.roomId, this.user.id, {
				userName: this.user.name || this.user.username,
				x: Math.round(body.x * 10) / 10,
				y: Math.round(body.y * 10) / 10,
				timestamp: cursorNow,
			});
			break;
			case 'clearCanvas':
				console.log(`🔍 [DEBUG] Processing canvas clear for room ${this.roomId} from user ${this.user.id}`);

				// Redisからキャンバスデータをクリア
				await this.drawingCanvasService.clearCanvas(this.roomId, this.user.id);

				// キャンバスクリアをルーム内の他のユーザーに配信
			await this.chatService.broadcastClearCanvas(this.roomId, this.user.id, {
				userId: this.user.id,
				userName: this.user.name || this.user.username,
				timestamp: Date.now(),
			});
				break;
			case 'undoStroke':
				console.log(`🔍 [DEBUG] Processing undo stroke for room ${this.roomId} from user ${this.user.id}`);

				// セキュリティ: レイヤー情報の検証
				if (!body || typeof body.layer !== 'number') {
					console.warn(`🔍 [SECURITY] Invalid undo stroke payload from user ${this.user.id}`);
					return;
				}

				// アンドゥイベントをルーム内の他のユーザーに配信
				await this.chatService.broadcastUndoStroke(this.roomId, this.user.id, {
					userId: this.user.id,
					userName: this.user.name || this.user.username,
					layer: body.layer,
					strokeId: body.strokeId,
					timestamp: Date.now(),
				});
				console.log(`🎨 [DEBUG] Broadcasted undo event for layer ${body.layer} from user ${this.user.id}`);
				break;
			case 'redoStroke':
				console.log(`🔍 [DEBUG] Processing redo stroke for room ${this.roomId} from user ${this.user.id}`);

				// セキュリティ: レイヤー情報とストロークデータの検証
				if (!body || typeof body.layer !== 'number' || !body.stroke) {
					console.warn(`🔍 [SECURITY] Invalid redo stroke payload from user ${this.user.id}`);
					return;
				}

				// リドゥイベントをルーム内の他のユーザーに配信
				await this.chatService.broadcastRedoStroke(this.roomId, this.user.id, {
					userId: this.user.id,
					userName: this.user.name || this.user.username,
					layer: body.layer,
					stroke: body.stroke,
					timestamp: Date.now(),
				});
				console.log(`🎨 [DEBUG] Broadcasted redo event for layer ${body.layer} from user ${this.user.id}`);
				break;
			case 'canvasSizeChange':
				console.log(`🔍 [DEBUG] Processing canvas size change for room ${this.roomId} from user ${this.user.id}`);

				// セキュリティ: キャンバスサイズの検証
				if (!body || typeof body.width !== 'number' || typeof body.height !== 'number') {
					console.warn(`🔍 [SECURITY] Invalid canvas size change payload from user ${this.user.id}`);
					return;
				}

				// サイズの範囲検証
				if (body.width < 100 || body.width > 4000 || body.height < 100 || body.height > 4000) {
					console.warn(`🔍 [SECURITY] Canvas size out of range from user ${this.user.id}: ${body.width}x${body.height}`);
					return;
				}

				// キャンバスサイズ変更イベントをルーム内の他のユーザーに配信
				await this.chatService.broadcastCanvasSizeChange(this.roomId, this.user.id, {
					userId: this.user.id,
					userName: this.user.name || this.user.username,
					width: body.width,
					height: body.height,
					timestamp: Date.now(),
				});
				console.log(`🎨 [DEBUG] Broadcasted canvas size change to ${body.width}x${body.height} from user ${this.user.id}`);
				break;
		}
	}

	@bindThis
	private async emitTypers() {
		const now = new Date();

		// 5秒以上経過したtyperを削除
		for (const [userId, date] of Object.entries(this.typers)) {
			if (now.getTime() - date.getTime() > 5000) delete this.typers[userId];
		}

		const typerUserIds = Object.keys(this.typers).filter(id => id !== this.user!.id);

		console.log(`🔍 [DEBUG] Emitting typing users for room ${this.roomId}:`, {
			allTypers: Object.keys(this.typers),
			filteredTypers: typerUserIds,
			currentUserId: this.user!.id
		});

		this.send('typing', {
			userIds: typerUserIds,
		});
	}

	@bindThis
	public dispose() {
		this.subscriber.off(`chatRoomStream:${this.roomId}`, this.onEvent);

		// oranski方式のclearIntervalは無効化
		// clearInterval(this.emitTypersIntervalId);
	}
}

@Injectable()
export class ChatRoomChannelService implements MiChannelService<true> {
	public readonly shouldShare = ChatRoomChannel.shouldShare;
	public readonly requireCredential = ChatRoomChannel.requireCredential;
	public readonly kind = ChatRoomChannel.kind;

	constructor(
		private chatService: ChatService,
		private drawingCanvasService: DrawingCanvasService,
		@Inject(DI.chatRoomsRepository)
		private chatRoomsRepository: ChatRoomsRepository,
	) {
	}

	@bindThis
	public create(id: string, connection: Channel['connection']): ChatRoomChannel {
		return new ChatRoomChannel(
			this.chatService,
			this.drawingCanvasService,
			this.chatRoomsRepository,
			id,
			connection,
		);
	}
}
