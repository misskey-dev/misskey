/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { FlashEntityService } from '@/core/entities/FlashEntityService.js';
import { FlashService } from '@/core/FlashService.js';

export const meta = {
	tags: ['flash'],

	requireCredential: false,

	res: {
		type: 'object',
		properties: {
			items: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'object',
					optional: false, nullable: false,
					ref: 'Flash',
				},
			},
			page: { type: 'integer', optional: false, nullable: false },
			allPages: { type: 'integer', optional: false, nullable: false },
			count: { type: 'integer', optional: false, nullable: false },
			allCount: { type: 'integer', optional: false, nullable: false },
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		page: { type: 'integer', minimum: 1, default: 1 },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private flashService: FlashService,
		private flashEntityService: FlashEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const result = await this.flashService.search(
				{
					query: {
						visibility: 'public',
					},
				},
				{
					limit: ps.limit,
					page: ps.page,
					sortKeys: ['-likedCount', '-updatedAt', '-id'],
				},
			);

			return {
				items: await this.flashEntityService.packMany(result.items, me),
				page: result.page,
				allPages: result.allPages,
				count: result.count,
				allCount: result.allCount,
			};
		});
	}
}
