/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import { Inject, Injectable } from '@nestjs/common';
import type { ChannelsRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { MetaService } from '@/core/MetaService.js';
import { ChannelEntityService } from '@/core/entities/ChannelEntityService.js';

export const meta = {
	tags: ['channels'],

	requireCredential: false,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Channel',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.channelsRepository)
		private channelsRepository: ChannelsRepository,

		private metaService: MetaService,
		private channelEntityService: ChannelEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const meta = await this.metaService.fetch();

			if (meta.featuredGameChannels.length === 0) return [];

			const channels = await this.channelsRepository.findBy({
				id: In(meta.featuredGameChannels)
			});

			return await this.channelEntityService.packMany(channels, me);
		});
	}
}
