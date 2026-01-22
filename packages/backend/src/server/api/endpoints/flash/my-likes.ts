/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { FlashLikeEntityService } from '@/core/entities/FlashLikeEntityService.js';
import { DI } from '@/di-symbols.js';
import { FlashService } from '@/core/FlashService.js';

export const meta = {
	tags: ['account', 'flash'],

	requireCredential: true,

	kind: 'read:flash-likes',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			properties: {
				id: {
					type: 'string',
					optional: false, nullable: false,
					format: 'id',
				},
				flash: {
					type: 'object',
					optional: false, nullable: false,
					ref: 'Flash',
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		sinceDate: { type: 'integer' },
		untilDate: { type: 'integer' },
		search: { type: 'string', minLength: 1, maxLength: 100, nullable: true },
	},
	required: [],
} as const;

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
