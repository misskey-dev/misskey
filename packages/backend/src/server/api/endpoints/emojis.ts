/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IsNull } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import type { EmojisRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { EmojiEntityService } from '@/core/entities/EmojiEntityService.js';
import { DI } from '@/di-symbols.js';
import { packedEmojiSimpleSchema } from '@/models/schema/emoji.js';

export const meta = {
	tags: ['meta'],

	requireCredential: false,
	allowGet: true,
	cacheSec: 3600,

	res: v.object({
		emojis: v.array(packedEmojiSimpleSchema),
	}),
} as const;

export const paramDef = v.object({});

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
				emojis: await this.emojiEntityService.packSimpleMany(emojis),
			};
		});
	}
}
