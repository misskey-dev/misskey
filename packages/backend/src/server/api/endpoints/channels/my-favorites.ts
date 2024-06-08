/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { ChannelFavoritesRepository } from '@/models/_.js';
import { ChannelEntityService } from '@/core/entities/ChannelEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['channels', 'account'],

	requireCredential: true,

	kind: 'read:channels',

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
	properties: {
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.channelFavoritesRepository)
		private channelFavoritesRepository: ChannelFavoritesRepository,

		private channelEntityService: ChannelEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.channelFavoritesRepository.createQueryBuilder('favorite')
				.andWhere('favorite.userId = :meId', { meId: me.id })
				.leftJoinAndSelect('favorite.channel', 'channel');

			const favorites = await query
				.getMany();

			return await Promise.all(favorites.map(x => this.channelEntityService.pack(x.channel!, me)));
		});
	}
}
