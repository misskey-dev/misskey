/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { FlashsRepository } from '@/models/_.js';
import { FlashEntityService } from '@/core/entities/FlashEntityService.js';
import { DI } from '@/di-symbols.js';
import { FlashService } from '@/core/FlashService.js';
import { packedFlashSchema } from '@/models/schema/flash.js';

export const meta = {
	tags: ['flash'],

	requireCredential: false,

	res: v.array(packedFlashSchema),
} as const;

export const paramDef = v.object({
	offset: v.optional(mi.integer({ min: 0 }), 0),
	limit: mi.limit({ max: 100, def: 10 }),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private flashService: FlashService,
		private flashEntityService: FlashEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const result = await this.flashService.featured({
				offset: ps.offset,
				limit: ps.limit,
			});
			return await this.flashEntityService.packMany(result, me);
		});
	}
}
