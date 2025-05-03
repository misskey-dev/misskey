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

		this.subscriber.on(`chatRoomStream:${this.roomId}`, this.onEvent);
	}

	@bindThis
	private async onEvent(data: GlobalEvents['chatRoom']['payload']) {
		this.send(data.type, data.body);
	}

	@bindThis
	public onMessage(type: string, body: any) {
		switch (type) {
			case 'read':
				if (this.roomId) {
					this.chatService.readRoomChatMessage(this.user!.id, this.roomId);
				}
				break;
		}
	}

	@bindThis
	public dispose() {
		this.subscriber.off(`chatRoomStream:${this.roomId}`, this.onEvent);
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
