/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AdsRepository } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { packedAdSchema } from '@/models/schema/ad.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:ad',
	res: packedAdSchema,
} as const;

export const paramDef = v.object({
	url: v.pipe(v.string(), mi.minCodePoints(1)),
	memo: v.string(),
	place: v.string(),
	priority: v.string(),
	ratio: mi.integer(),
	expiresAt: mi.integer(),
	startsAt: mi.integer(),
	imageUrl: v.pipe(v.string(), mi.minCodePoints(1)),
	dayOfWeek: mi.integer(),
	isSensitive: v.optional(v.boolean()),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.adsRepository)
		private adsRepository: AdsRepository,

		private idService: IdService,
		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const ad = await this.adsRepository.insertOne({
				id: this.idService.gen(),
				expiresAt: new Date(ps.expiresAt),
				startsAt: new Date(ps.startsAt),
				dayOfWeek: ps.dayOfWeek,
				isSensitive: ps.isSensitive,
				url: ps.url,
				imageUrl: ps.imageUrl,
				priority: ps.priority,
				ratio: ps.ratio,
				place: ps.place,
				memo: ps.memo,
			});

			this.moderationLogService.log(me, 'createAd', {
				adId: ad.id,
				ad: ad,
			});

			return {
				id: ad.id,
				expiresAt: ad.expiresAt.toISOString(),
				startsAt: ad.startsAt.toISOString(),
				dayOfWeek: ad.dayOfWeek,
				isSensitive: ad.isSensitive,
				url: ad.url,
				imageUrl: ad.imageUrl,
				priority: ad.priority,
				ratio: ad.ratio,
				place: ad.place,
				memo: ad.memo,
			};
		});
	}
}
