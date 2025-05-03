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

		this.subscriber.on(`chatUserStream:${this.user!.id}-${this.otherId}`, this.onEvent);
	}

	@bindThis
	private async onEvent(data: GlobalEvents['chatUser']['payload']) {
		this.send(data.type, data.body);
	}

	@bindThis
	public onMessage(type: string, body: any) {
		switch (type) {
			case 'read':
				if (this.otherId) {
					this.chatService.readUserChatMessage(this.user!.id, this.otherId);
				}
				break;
		}
	}

	@bindThis
	public dispose() {
		this.subscriber.off(`chatUserStream:${this.user!.id}-${this.otherId}`, this.onEvent);
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
