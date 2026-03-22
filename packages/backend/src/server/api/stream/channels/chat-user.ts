/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, Scope } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import type { GlobalEvents } from '@/core/GlobalEventService.js';
import type { JsonObject } from '@/misc/json-value.js';
import { ChatService } from '@/core/ChatService.js';
import { DrawingCanvasService } from '@/core/DrawingCanvasService.js';
import Channel, { type ChannelRequest } from '../channel.js';
import { REQUEST } from '@nestjs/core';

@Injectable({ scope: Scope.TRANSIENT })
export class ChatUserChannel extends Channel {
	public readonly chName = 'chatUser';
	public static shouldShare = false;
	public static requireCredential = true as const;
	public static kind = 'read:chat';
	private otherId: string;
	private typers: Record<string, Date> = {};
	private emitTypersIntervalId: ReturnType<typeof setInterval>;

	// レート制限用（カーソル移動のみ）
	private lastCursorMove: number = 0;

	constructor(
		@Inject(REQUEST)
		request: ChannelRequest,

		private chatService: ChatService,
		private drawingCanvasService: DrawingCanvasService,
	) {
		super(request);
	}

	@bindThis
	public async init(params: JsonObject): Promise<boolean> {
		if (typeof params.otherId !== 'string') return false;
		if (!this.user) return false;
		if (params.otherId === this.user.id) return false;

		this.otherId = params.otherId;

		// IDをソートして統一的なチャンネル名を作成
		const sortedIds = [this.user!.id, this.otherId].sort();
		const channelName = `chatUserStream:${sortedIds[0]}-${sortedIds[1]}` as `chatUserStream:${string}-${string}`;
		this.subscriber.on(channelName, this.onEvent);

		return true;
	}

	@bindThis
	private async onEvent(data: GlobalEvents['chatUser']['payload']) {
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
		// セキュリティ: ユーザー認証確認
		if (!this.user) {
			return;
		}

		switch (type) {
			case 'read':
				if (this.otherId) {
					this.chatService.readUserChatMessage(this.user.id, this.otherId);
				}
				break;
			case 'typing':
				// セキュリティ: typing送信者を認証済みユーザーIDに強制設定
				// フロントエンドからのuserIdパラメータは無視し、認証済みセッションのユーザーIDを使用
				if (this.otherId) {
					this.chatService.notifyUserTyping(this.user.id, this.otherId);
				}
				break;
			case 'typingStop':
				// セキュリティ: typingStop送信者を認証済みユーザーIDに強制設定
				// フロントエンドからのuserIdパラメータは無視し、認証済みセッションのユーザーIDを使用
				if (this.otherId) {
					this.chatService.notifyUserTypingStop(this.user.id, this.otherId);
				}
				break;

			// お絵描き機能
			case 'drawingStroke':
				await this.handleDrawingStroke(body);
				break;
			case 'drawingProgress':
				await this.handleDrawingProgress(body);
				break;
			case 'cursorMove':
				await this.handleCursorMove(body);
				break;
			case 'clearCanvas':
				await this.handleClearCanvas(body);
				break;
			case 'undoStroke':
				await this.handleUndoStroke(body);
				break;
			case 'redoStroke':
				await this.handleRedoStroke(body);
				break;
			case 'canvasSizeChange':
				await this.handleCanvasSizeChange(body);
				break;
		}
	}

	// お絵描きストロークの処理
	@bindThis
	private async handleDrawingStroke(body: any) {
		// drawingStrokeは完了したストロークなので、レート制限を設けずすべて保存する
		try {
			const actor = this.user;
			if (!actor) return;

			// ユーザー間チャット用のdrawingIdを生成
			const sortedIds = [actor.id, this.otherId].sort();
			const drawingId = `user-${sortedIds[0]}-${sortedIds[1]}`;

			const strokeData = this.drawingCanvasService.normalizeStrokeData(drawingId, actor, body);
			if (!strokeData) {
				console.warn(`🔍 [SECURITY] Invalid drawing stroke payload rejected for user chat ${drawingId}`);
				return;
			}

			const canAccess = await this.drawingCanvasService.canUserAccessCanvas(drawingId, actor.id);
			if (!canAccess) {
				console.warn(`🔍 [SECURITY] User ${actor.id} denied drawing access for ${drawingId}`);
				return;
			}

			await this.drawingCanvasService.addStroke(drawingId, strokeData);

			// ChatServiceを使って配信
			await this.chatService.broadcastUserDrawingStroke(actor.id, this.otherId, actor.id, strokeData);
		} catch (error) {
			console.error('Drawing stroke error:', error);
		}
	}

	// お絵描き進行状況の処理
	@bindThis
	private async handleDrawingProgress(body: any) {
		try {
			const actor = this.user;
			if (!actor) return;

			if (!body || typeof body !== 'object') return;
			if (!Array.isArray(body.points) || body.points.length === 0 || body.points.length > 500) return;
			if (!['pen', 'eraser', 'eyedropper'].includes(body.tool)) return;
			if (typeof body.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(body.color)) return;
			if (typeof body.strokeWidth !== 'number' || body.strokeWidth < 1 || body.strokeWidth > 100) return;
			if (typeof body.opacity !== 'number' || body.opacity < 0.1 || body.opacity > 1) return;

			const maxLayer = this.drawingCanvasService.getMaxLayerIndex();
			const layerIndex = Math.min(Math.max(Math.floor(typeof body.layer === 'number' ? body.layer : 0), 0), maxLayer);

			const progressData = {
				userName: actor.username || actor.name || 'Unknown',
				userId: actor.id,
				timestamp: Date.now(),
				layer: layerIndex,
				points: body.points.map((p: any) => ({
					x: Math.min(Math.max(Math.round(p.x), 0), 4000),
					y: Math.min(Math.max(Math.round(p.y), 0), 4000),
					pressure: typeof p.pressure === 'number' ? Math.min(Math.max(p.pressure, 0), 1) : 1.0,
				})),
				tool: body.tool,
				color: body.color,
				strokeWidth: body.strokeWidth,
				opacity: body.opacity,
			};

			// ChatServiceを使って配信
			await this.chatService.broadcastUserDrawingProgress(actor.id, this.otherId, actor.id, progressData);
		} catch (error) {
			console.error('Drawing progress error:', error);
		}
	}

	// カーソル移動の処理
	@bindThis
	private async handleCursorMove(body: any) {
		const now = Date.now();
		const CURSOR_MOVE_RATE_LIMIT = 50; // 50ms間隔

		// レート制限チェック
		if (now - this.lastCursorMove < CURSOR_MOVE_RATE_LIMIT) {
			return; // レート制限によりスキップ
		}

		// セキュリティ: カーソル位置の検証
		if (!body || typeof body.x !== 'number' || typeof body.y !== 'number') return;
		if (body.x < -100 || body.x > 4100 || body.y < -100 || body.y > 4100) return; // 可変キャンバスサイズ対応

		this.lastCursorMove = now;

		const actor = this.user;
		if (!actor) return;

		// カーソル位置データを構成
		const cursorData = {
			userName: actor.username || actor.name || 'Unknown',
			x: Math.round(body.x * 10) / 10, // 高精度座標
			y: Math.round(body.y * 10) / 10,
			timestamp: Date.now(),
		};

		// ChatServiceを使って配信
		await this.chatService.broadcastUserCursorMove(actor.id, this.otherId, actor.id, cursorData);
	}

	// キャンバスクリアの処理
	@bindThis
	private async handleClearCanvas(body: any) {
		try {
			const actor = this.user;
			if (!actor) return;

			// ユーザー間チャット用のdrawingIdを生成
			const sortedIds = [actor.id, this.otherId].sort();
			const drawingId = `user-${sortedIds[0]}-${sortedIds[1]}`;

			// キャンバスをクリア
			await this.drawingCanvasService.clearCanvas(drawingId, actor.id);

			// ChatServiceを使って配信
			const clearData = {
				userId: actor.id,
				userName: actor.name || actor.username,
				timestamp: Date.now(),
			};
			await this.chatService.broadcastUserClearCanvas(actor.id, this.otherId, actor.id, clearData);
		} catch (error) {
			console.error('Clear canvas error:', error);
		}
	}

	// アンドゥの処理
	@bindThis
	private async handleUndoStroke(body: any) {
		try {
			const actor = this.user;
			if (!actor) return;

			// セキュリティ: レイヤー情報の検証
			if (!body || typeof body.layer !== 'number') {
				console.warn(`🔍 [SECURITY] Invalid undo stroke payload from user ${actor.id}`);
				return;
			}

			// ChatServiceを使って配信
			const undoData = {
				userId: actor.id,
				userName: actor.name || actor.username,
				layer: body.layer,
				strokeId: body.strokeId,
				timestamp: Date.now(),
			};
			await this.chatService.broadcastUserUndoStroke(actor.id, this.otherId, actor.id, undoData);
		} catch (error) {
			console.error('Undo stroke error:', error);
		}
	}

	// リドゥの処理
	@bindThis
	private async handleRedoStroke(body: any) {
		try {
			const actor = this.user;
			if (!actor) return;

			// セキュリティ: レイヤー情報とストロークデータの検証
			if (!body || typeof body.layer !== 'number' || !body.stroke) {
				console.warn(`🔍 [SECURITY] Invalid redo stroke payload from user ${actor.id}`);
				return;
			}

			// ChatServiceを使って配信
			const redoData = {
				userId: actor.id,
				userName: actor.name || actor.username,
				layer: body.layer,
				stroke: body.stroke,
				timestamp: Date.now(),
			};
			await this.chatService.broadcastUserRedoStroke(actor.id, this.otherId, actor.id, redoData);
		} catch (error) {
			console.error('Redo stroke error:', error);
		}
	}

	// キャンバスサイズ変更の処理
	@bindThis
	private async handleCanvasSizeChange(body: any) {
		try {
			const actor = this.user;
			if (!actor) return;

			// セキュリティ: キャンバスサイズの検証
			if (!body || typeof body.width !== 'number' || typeof body.height !== 'number') {
				console.warn(`🔍 [SECURITY] Invalid canvas size change payload from user ${actor.id}`);
				return;
			}

			// サイズの範囲検証
			if (body.width < 100 || body.width > 4000 || body.height < 100 || body.height > 4000) {
				console.warn(`🔍 [SECURITY] Canvas size out of range from user ${actor.id}: ${body.width}x${body.height}`);
				return;
			}

			// ChatServiceを使って配信
			const sizeData = {
				userId: actor.id,
				userName: actor.name || actor.username,
				width: body.width,
				height: body.height,
				timestamp: Date.now(),
			};
			await this.chatService.broadcastUserCanvasSizeChange(actor.id, this.otherId, actor.id, sizeData);
		} catch (error) {
			console.error('Canvas size change error:', error);
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

		this.send('typing', {
			userIds: typerUserIds,
		});
	}

	@bindThis
	public dispose() {
		const actor = this.user;
		if (!actor) return;

		// IDをソートして統一的なチャンネル名を作成
		const sortedIds = [actor.id, this.otherId].sort();
		(this.subscriber as any).off(`chatUserStream:${sortedIds[0]}-${sortedIds[1]}`, this.onEvent);

		// oranski方式のclearIntervalは無効化
		// clearInterval(this.emitTypersIntervalId);
	}
}

