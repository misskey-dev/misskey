/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { FeaturedService } from '@/core/FeaturedService.js';
import { HashtagService } from '@/core/HashtagService.js';

export const meta = {
	tags: ['hashtags'],

	requireCredential: false,
	allowGet: true,
	cacheSec: 60 * 1,

	res: v.array(v.object({
		tag: v.string(),
		chart: v.array(v.number()),
		usersCount: v.number(),
	})),
} as const;

export const paramDef = v.object({});

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
