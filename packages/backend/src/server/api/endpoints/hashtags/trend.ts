/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { FeaturedService } from '@/core/FeaturedService.js';
import { HashtagService } from '@/core/HashtagService.js';

export const meta = {
	tags: ['hashtags'],

	requireCredential: false,
	allowGet: true,
	cacheSec: 60 * 1,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				tag: {
					type: 'string',
					optional: false, nullable: false,
				},
				chart: {
					type: 'array',
					optional: false, nullable: false,
					items: {
						type: 'number',
						optional: false, nullable: false,
					},
				},
				usersCount: {
					type: 'number',
					optional: false, nullable: false,
				},
			},
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
		private featuredService: FeaturedService,
		private hashtagService: HashtagService,
	) {
		super(meta, paramDef, async () => {
			const ranking = await this.featuredService.getHashtagsRanking(10);

			const charts = ranking.length === 0 ? {} : await this.hashtagService.getCharts(ranking, 20);

			const stats = ranking.map((tag, i) => ({
				tag,
				chart: charts[tag],
				usersCount: Math.max(...charts[tag]),
			}));

			return stats;
		});
	}
}
