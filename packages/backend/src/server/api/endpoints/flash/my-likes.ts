/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { FlashLikeEntityService } from '@/core/entities/FlashLikeEntityService.js';
import { DI } from '@/di-symbols.js';
import { FlashService } from '@/core/FlashService.js';
import { packedFlashSchema } from '@/models/schema/flash.js';

export const meta = {
	tags: ['account', 'flash'],

	requireCredential: true,

	kind: 'read:flash-likes',

	res: v.array(v.object({
		id: mi.idString(),
		flash: packedFlashSchema,
	})),
} as const;

export const paramDef = v.object({
	...mi.paginationEntries({ max: 100, default: 10 }),
	...mi.paginationDateEntries(),
	search: v.optional(v.nullable(v.pipe(v.string(), mi.minCodePoints(1), mi.maxCodePoints(100)))),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private flashLikeEntityService: FlashLikeEntityService,
		private flashService: FlashService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const likes = await this.flashService.myLikes(me.id, {
				sinceId: ps.sinceId,
				untilId: ps.untilId,
				sinceDate: ps.sinceDate,
				untilDate: ps.untilDate,
				limit: ps.limit,
				search: ps.search,
			});

			return this.flashLikeEntityService.packMany(likes, me);
		});
	}
}
