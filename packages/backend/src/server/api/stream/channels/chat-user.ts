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

class ChatUserChannel extends Channel {
	public readonly chName = 'chatUser';
	public static shouldShare = false;
	public static requireCredential = true as const;
	public static kind = 'read:chat';
	private otherId: string;
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
	public onMessage(type: string, body: any) {
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
	) {
	}

	@bindThis
	public create(id: string, connection: Channel['connection']): ChatUserChannel {
		return new ChatUserChannel(
			this.chatService,
			id,
			connection,
		);
	}
}
