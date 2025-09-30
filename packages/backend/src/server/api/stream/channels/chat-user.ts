/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import type { GlobalEvents } from '@/core/GlobalEventService.js';
import type { JsonObject } from '@/misc/json-value.js';
import { ChatService } from '@/core/ChatService.js';
import { DrawingCanvasService } from '@/core/DrawingCanvasService.js';
import Channel, { type MiChannelService } from '../channel.js';

class ChatUserChannel extends Channel {
	public readonly chName = 'chatUser';
	public static shouldShare = false;
	public static requireCredential = true as const;
	public static kind = 'read:chat';
	private otherId: string;
	private typers: Record<string, Date> = {};
	private emitTypersIntervalId: ReturnType<typeof setInterval>;

	// レート制限用（お絵描き機能）
	private lastDrawingStroke: number = 0;
	private lastCursorMove: number = 0;
	private drawingStrokeCount: number = 0;
	private cursorMoveCount: number = 0;

	constructor(
		private chatService: ChatService,
		private drawingCanvasService: DrawingCanvasService,

		id: string,
		connection: Channel['connection'],
	) {
		super(id, connection);
	}

	@bindThis
	public async init(params: JsonObject) {
		if (typeof params.otherId !== 'string') return;
		this.otherId = params.otherId;

		// oranski方式の定期的なemitTypersは無効化
		// this.emitTypersIntervalId = setInterval(this.emitTypers, 5000);
		// IDをソートして統一的なチャンネル名を作成
		const sortedIds = [this.user!.id, this.otherId].sort();
		this.subscriber.on(`chatUserStream:${sortedIds[0]}-${sortedIds[1]}`, this.onEvent);
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
		console.log(`🔍 [DEBUG] ChatUserChannel received message - type: ${type}, userId: ${this.user!.id}, otherId: ${this.otherId}`);

		// セキュリティ: ユーザー認証確認
		if (!this.user) {
			console.warn(`🔍 [SECURITY] Unauthenticated user attempting ${type} event`);
			return;
		}

		switch (type) {
			case 'read':
				if (this.otherId) {
					this.chatService.readUserChatMessage(this.user.id, this.otherId);
				}
				break;
			case 'typing':
				console.log(`🔍 [DEBUG] Processing typing event for user chat ${this.user.id} -> ${this.otherId}`);

				// セキュリティ: typing送信者を認証済みユーザーIDに強制設定
				// フロントエンドからのuserIdパラメータは無視し、認証済みセッションのユーザーIDを使用
				if (this.otherId) {
					this.chatService.notifyUserTyping(this.user.id, this.otherId);
				}
				break;
			case 'typingStop':
				console.log(`🔍 [DEBUG] Processing typingStop event for user chat ${this.user.id} -> ${this.otherId}`);

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
		}
	}

	// お絵描きストロークの処理
	@bindThis
	private async handleDrawingStroke(body: any) {
		const now = Date.now();
		const DRAWING_STROKE_RATE_LIMIT = 100; // 100ms間隔
		const DRAWING_STROKE_BURST_LIMIT = 10; // 1秒間に10回まで

		// レート制限チェック
		if (now - this.lastDrawingStroke < DRAWING_STROKE_RATE_LIMIT) {
			return; // レート制限によりスキップ
		}

		// バースト制限チェック
		if (now - this.lastDrawingStroke < 1000) {
			this.drawingStrokeCount++;
			if (this.drawingStrokeCount > DRAWING_STROKE_BURST_LIMIT) {
				return; // バースト制限によりスキップ
			}
		} else {
			this.drawingStrokeCount = 1;
		}

		this.lastDrawingStroke = now;

		try {
			// ユーザー間チャット用のdrawingIdを生成
			const sortedIds = [this.user!.id, this.otherId].sort();
			const drawingId = `user-${sortedIds[0]}-${sortedIds[1]}`;

			// ユーザー名を設定
			body.userName = this.user!.username || this.user!.name || 'Unknown';
			body.userId = this.user!.id;

			// Redisにストロークを保存
			await this.drawingCanvasService.addStroke(drawingId, body);

			// 他の参加者に配信（自分以外）
			this.subscriber.emit(`chatUserStream:${sortedIds[0]}-${sortedIds[1]}`, {
				type: 'drawingStroke',
				body: body,
			});
		} catch (error) {
			console.error('Drawing stroke error:', error);
		}
	}

	// お絵描き進行状況の処理
	@bindThis
	private async handleDrawingProgress(body: any) {
		const now = Date.now();
		const DRAWING_PROGRESS_RATE_LIMIT = 50; // 50ms間隔（進行状況は高頻度）

		// レート制限チェック
		if (now - this.lastDrawingStroke < DRAWING_PROGRESS_RATE_LIMIT) {
			return; // レート制限によりスキップ
		}

		this.lastDrawingStroke = now;

		try {
			// セキュリティ: 描画データの詳細検証
			if (!body || typeof body !== 'object') return;
			if (!Array.isArray(body.points) || body.points.length === 0 || body.points.length > 500) return; // 進行中は点数制限緩和
			if (!['pen', 'eraser', 'eyedropper'].includes(body.tool)) return;
			if (typeof body.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(body.color)) return;
			if (typeof body.strokeWidth !== 'number' || body.strokeWidth < 1 || body.strokeWidth > 50) return;
			if (typeof body.opacity !== 'number' || body.opacity < 0.1 || body.opacity > 1) return;

			// ユーザー名を設定
			body.userName = this.user!.username || this.user!.name || 'Unknown';
			body.userId = this.user!.id;
			body.timestamp = now;

			// 他の参加者に配信（リアルタイム、Redisには保存しない）
			const sortedIds = [this.user!.id, this.otherId].sort();
			this.subscriber.emit(`chatUserStream:${sortedIds[0]}-${sortedIds[1]}`, {
				type: 'drawingProgress',
				body: body,
			});
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
		if (body.x < 0 || body.x > 800 || body.y < 0 || body.y > 600) return; // キャンバスサイズ制限 (800x600)

		this.lastCursorMove = now;

		// カーソル位置データを構成
		const cursorData = {
			userId: this.user!.id,
			userName: this.user!.username || this.user!.name || 'Unknown',
			x: Math.round(body.x * 10) / 10, // 高精度座標
			y: Math.round(body.y * 10) / 10,
			timestamp: Date.now(),
		};

		// 他の参加者に配信（リアルタイム）
		const sortedIds = [this.user!.id, this.otherId].sort();
		this.subscriber.emit(`chatUserStream:${sortedIds[0]}-${sortedIds[1]}`, {
			type: 'cursorMove',
			body: cursorData,
		});
	}

	// キャンバスクリアの処理
	@bindThis
	private async handleClearCanvas(body: any) {
		try {
			// ユーザー間チャット用のdrawingIdを生成
			const sortedIds = [this.user!.id, this.otherId].sort();
			const drawingId = `user-${sortedIds[0]}-${sortedIds[1]}`;

			// キャンバスをクリア
			await this.drawingCanvasService.clearCanvas(drawingId, this.user!.id);

			// 他の参加者に配信
			this.subscriber.emit(`chatUserStream:${sortedIds[0]}-${sortedIds[1]}`, {
				type: 'clearCanvas',
				body: {},
			});
		} catch (error) {
			console.error('Clear canvas error:', error);
		}
	}

	// アンドゥの処理
	@bindThis
	private async handleUndoStroke(body: any) {
		try {
			// ユーザー間チャット用のdrawingIdを生成
			const sortedIds = [this.user!.id, this.otherId].sort();
			const drawingId = `user-${sortedIds[0]}-${sortedIds[1]}`;

			// アンドゥを実行
			const undoneStroke = await this.drawingCanvasService.performUndo(drawingId, this.user!.id);

			if (undoneStroke) {
				// 他の参加者に配信
				this.subscriber.emit(`chatUserStream:${sortedIds[0]}-${sortedIds[1]}`, {
					type: 'undoStroke',
					body: {
						strokeId: undoneStroke.id,
						userId: this.user!.id,
					},
				});
			}
		} catch (error) {
			console.error('Undo stroke error:', error);
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
		// IDをソートして統一的なチャンネル名を作成
		const sortedIds = [this.user!.id, this.otherId].sort();
		this.subscriber.off(`chatUserStream:${sortedIds[0]}-${sortedIds[1]}`, this.onEvent);

		// oranski方式のclearIntervalは無効化
		// clearInterval(this.emitTypersIntervalId);
	}
}

@Injectable()
export class ChatUserChannelService implements MiChannelService<true> {
	public readonly shouldShare = ChatUserChannel.shouldShare;
	public readonly requireCredential = ChatUserChannel.requireCredential;
	public readonly kind = ChatUserChannel.kind;

	constructor(
		private chatService: ChatService,
		private drawingCanvasService: DrawingCanvasService,
	) {
	}

	@bindThis
	public create(id: string, connection: Channel['connection']): ChatUserChannel {
		return new ChatUserChannel(
			this.chatService,
			this.drawingCanvasService,
			id,
			connection,
		);
	}
}
