/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ChannelMutingService } from '@/core/ChannelMutingService.js';
import { ChannelEntityService } from '@/core/entities/ChannelEntityService.js';
import { packedChannelSchema } from '@/models/schema/channel.js';

export const meta = {
	tags: ['channels', 'mute'],

	requireCredential: true,
	prohibitMoved: true,

	kind: 'read:channels',

	res: v.array(packedChannelSchema),
} as const;

export const paramDef = v.object({});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private channelMutingService: ChannelMutingService,
		private channelEntityService: ChannelEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const mutings = await this.channelMutingService.list({
				requestUserId: me.id,
			});
			return await this.channelEntityService.packMany(mutings, me);
		});
	}
}
