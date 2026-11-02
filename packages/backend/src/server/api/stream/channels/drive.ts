/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, Scope } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import type { JsonObject } from '@/misc/json-value.js';
import type { EventTypesToEventPayload, DriveEventTypes } from '@/core/GlobalEventService.js';
import Channel, { type ChannelRequest } from '../channel.js';
import { REQUEST } from '@nestjs/core';

@Injectable({ scope: Scope.TRANSIENT })
export class DriveChannel extends Channel {
	public readonly chName = 'drive';
	public static shouldShare = true;
	public static requireCredential = true as const;
	public static kind = 'read:account';

	constructor(
		@Inject(REQUEST)
		request: ChannelRequest,
	) {
		super(request);
	}

	@bindThis
	public async init(params: JsonObject) {
		// Subscribe drive stream
		this.subscriber.on(`driveStream:${this.user!.id}`, this.onData);
	}

	@bindThis
	private async onData(data: EventTypesToEventPayload<DriveEventTypes>) {
		this.send(data);
	}

	@bindThis
	public dispose() {
		this.subscriber.off(`driveStream:${this.user?.id}`, this.onData);
	}
}
