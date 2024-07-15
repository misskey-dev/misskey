/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { EmojiRequestsRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { EmojiRequestsEntityService } from '@/core/entities/EmojiRequestsEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['meta'],

	requireCredential: false,
	allowGet: true,
	cacheSec: 3600,

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			emojis: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'object',
					optional: false, nullable: false,
					ref: 'EmojiRequestSimple',
				},
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
		@Inject(DI.emojiRequestsRepository)
		private emojiRequestsRepository: EmojiRequestsRepository,

		private emojiRequestsEntityService: EmojiRequestsEntityService,
	) {
		super(meta, paramDef, async () => {
			const emojis = await this.emojiRequestsRepository.find({
				order: {
					category: 'ASC',
					name: 'ASC',
				},
			});

			return {
				emojis: await this.emojiRequestsEntityService.packSimpleMany(emojis),
			};
		});
	}
}
