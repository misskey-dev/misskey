/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AdsRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { DI } from '@/di-symbols.js';
import { packedAdSchema } from '@/models/schema/ad.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:ad',
	res: v.array(packedAdSchema),
} as const;

export const paramDef = v.object({
	...mi.paginationEntries({ max: 100, default: 10 }),
	...mi.paginationDateEntries(),
	publishing: v.optional(v.nullable(v.boolean()), null),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.adsRepository)
		private adsRepository: AdsRepository,

		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.adsRepository.createQueryBuilder('ad'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate);
			if (ps.publishing === true) {
				query.andWhere('ad.expiresAt > :now', { now: new Date() }).andWhere('ad.startsAt <= :now', { now: new Date() });
			} else if (ps.publishing === false) {
				query.andWhere('ad.expiresAt <= :now', { now: new Date() }).orWhere('ad.startsAt > :now', { now: new Date() });
			}
			const ads = await query.limit(ps.limit).getMany();

			return ads.map(ad => ({
				id: ad.id,
				expiresAt: ad.expiresAt.toISOString(),
				startsAt: ad.startsAt.toISOString(),
				dayOfWeek: ad.dayOfWeek,
				isSensitive: ad.isSensitive,
				url: ad.url,
				imageUrl: ad.imageUrl,
				memo: ad.memo,
				place: ad.place,
				priority: ad.priority,
				ratio: ad.ratio,
			}));
		});
	}
}
