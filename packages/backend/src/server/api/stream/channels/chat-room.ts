/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import type { GlobalEvents } from '@/core/GlobalEventService.js';
import type { JsonObject } from '@/misc/json-value.js';
import { ChatService } from '@/core/ChatService.js';
import Channel, { type MiChannelService } from '../channel.js';

class ChatRoomChannel extends Channel {
	public readonly chName = 'chatRoom';
	public static shouldShare = false;
	public static requireCredential = true as const;
	public static kind = 'read:chat';
	private roomId: string;
	private typers: Record<string, Date> = {};
	private emitTypersIntervalId: ReturnType<typeof setInterval>;

	constructor(
		private chatService: ChatService,

		id: string,
		connection: Channel['connection'],
	) {
		super(id, connection);
	}

	@bindThis
	public async init(params: JsonObject) {
		if (typeof params.roomId !== 'string') return;
		this.roomId = params.roomId;

		// oranski方式の定期的なemitTypersは無効化
		// this.emitTypersIntervalId = setInterval(this.emitTypers, 5000);
		this.subscriber.on(`chatRoomStream:${this.roomId}`, this.onEvent);
	}

	@bindThis
	private async onEvent(data: GlobalEvents['chatRoom']['payload']) {
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
	public onMessage(type: string, body: any) {
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
	) {
	}

	@bindThis
	public create(id: string, connection: Channel['connection']): ChatRoomChannel {
		return new ChatRoomChannel(
			this.chatService,
			id,
			connection,
		);
	}
}
