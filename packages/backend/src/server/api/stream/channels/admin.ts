/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, Scope } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import type { JsonObject } from '@/misc/json-value.js';
import type { EventTypesToEventPayload, AdminEventTypes } from '@/core/GlobalEventService.js';
import Channel, { type ChannelRequest } from '../channel.js';
import { REQUEST } from '@nestjs/core';

@Injectable({ scope: Scope.TRANSIENT })
export class AdminChannel extends Channel {
	public readonly chName = 'admin';
	public static shouldShare = true;
	public static requireCredential = true as const;
	public static kind = 'read:admin:stream';

	constructor(
		@Inject(REQUEST)
		request: ChannelRequest,
	) {
		super(request);
	}

	@bindThis
	public async init(params: JsonObject) {
		// Subscribe admin stream
		this.subscriber.on(`adminStream:${this.user!.id}`, this.onData);
	}

	@bindThis
	private async onData(data: EventTypesToEventPayload<AdminEventTypes>) {
		this.send(data);
	}

	@bindThis
	public dispose() {
		this.subscriber.off(`adminStream:${this.user?.id}`, this.onData);
	}
}
