/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AdsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:ad',

	errors: {
		noSuchAd: {
			message: 'No such ad.',
			code: 'NO_SUCH_AD',
			id: 'b7aa1727-1354-47bc-a182-3a9c3973d300',
		},
	},
} as const;

export const paramDef = v.object({
	id: mi.misskeyId(),
	memo: v.optional(v.string()),
	url: v.optional(v.pipe(v.string(), mi.minCodePoints(1))),
	imageUrl: v.optional(v.pipe(v.string(), mi.minCodePoints(1))),
	place: v.optional(v.string()),
	priority: v.optional(v.string()),
	ratio: v.optional(mi.integer()),
	expiresAt: v.optional(mi.integer()),
	startsAt: v.optional(mi.integer()),
	dayOfWeek: v.optional(mi.integer()),
	isSensitive: v.optional(v.boolean()),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.adsRepository)
		private adsRepository: AdsRepository,

		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const ad = await this.adsRepository.findOneBy({ id: ps.id });

			if (ad == null) throw new ApiError(meta.errors.noSuchAd);

			await this.adsRepository.update(ad.id, {
				url: ps.url,
				place: ps.place,
				priority: ps.priority,
				ratio: ps.ratio,
				memo: ps.memo,
				imageUrl: ps.imageUrl,
				expiresAt: ps.expiresAt ? new Date(ps.expiresAt) : undefined,
				startsAt: ps.startsAt ? new Date(ps.startsAt) : undefined,
				dayOfWeek: ps.dayOfWeek,
				isSensitive: ps.isSensitive,
			});

			const updatedAd = await this.adsRepository.findOneByOrFail({ id: ad.id });

			this.moderationLogService.log(me, 'updateAd', {
				adId: ad.id,
				before: ad,
				after: updatedAd,
			});
		});
	}
}
