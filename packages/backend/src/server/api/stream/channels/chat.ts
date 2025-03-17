/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import type { GlobalEvents } from '@/core/GlobalEventService.js';
import type { JsonObject } from '@/misc/json-value.js';
import Channel, { type MiChannelService } from '../channel.js';

class ChatChannel extends Channel {
	public readonly chName = 'chat';
	public static shouldShare = false;
	public static requireCredential = true as const;
	public static kind = 'read:chat';
	private otherId: string;

	constructor(
		id: string,
		connection: Channel['connection'],
	) {
		super(id, connection);
	}

	@bindThis
	public async init(params: JsonObject) {
		if (typeof params.otherId !== 'string') return;
		this.otherId = params.otherId;

		this.subscriber.on(`chatStream:${this.user.id}-${this.otherId}`, this.onEvent);
	}

	@bindThis
	private async onEvent(data: GlobalEvents['chat']['payload']) {
		this.send(data.type, data.body);
	}

	@bindThis
	public dispose() {
		// Unsubscribe events
		this.subscriber.off(`chatStream:${this.user.id}-${this.otherId}`, this.onEvent);
	}
}

@Injectable()
export class ChatChannelService implements MiChannelService<true> {
	public readonly shouldShare = ChatChannel.shouldShare;
	public readonly requireCredential = ChatChannel.requireCredential;
	public readonly kind = ChatChannel.kind;

	constructor(
	) {
	}

	@bindThis
	public create(id: string, connection: Channel['connection']): ChatChannel {
		return new ChatChannel(
			id,
			connection,
		);
	}
}
