/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { CustomEmojiService } from '@/core/CustomEmojiService.js';

export const meta = {
	tags: ['meta'],

	requireCredential: false,

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			count: {
				type: 'number',
				optional: false, nullable: false,
			},
			lastUpdatedAt: {
				type: 'string',
				optional: false, nullable: true,
				format: 'date-time',
			},
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
		private customEmojiService: CustomEmojiService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const stats = await this.customEmojiService.getLocalEmojisStats();

			return {
				count: stats.count,
				lastUpdatedAt: stats.lastUpdatedAt ? stats.lastUpdatedAt.toISOString() : null,
			};
		});
	}
}
