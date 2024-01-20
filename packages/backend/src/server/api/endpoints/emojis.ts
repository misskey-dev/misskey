/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IsNull } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { EmojisRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { EmojiEntityService } from '@/core/entities/EmojiEntityService.js';
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
					anyOf: [
						{
							type: 'object',
							optional: false, nullable: false,
							ref: 'EmojiSimple',
						},
						{
							type: 'object',
							optional: false, nullable: false,
							ref: 'EmojiDetailed',
						},
					],
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		detail: {
			type: 'boolean',
			nullable: true,
		},
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.emojisRepository)
		private emojisRepository: EmojisRepository,

		private emojiEntityService: EmojiEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const emojis = await this.emojisRepository.find({
				where: {
					host: IsNull(),
				},
				order: {
					category: 'ASC',
					name: 'ASC',
				},
			});

			return {
				emojis: ps.detail
					? await this.emojiEntityService.packDetailedMany(emojis)
					: await this.emojiEntityService.packSimpleMany(emojis),
			};
		});
	}
}
