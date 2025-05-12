/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { EmojiMutesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';

// TODO: UserWebhook schemaの適用
export const meta = {
	tags: ['emoji', 'mute'],

	requireCredential: true,

	kind: 'read:account',

	res: {
		type: 'array',
		items: {
			type: 'object',
			properties: {
				emojis: {
					type: 'array',
					items: {
						type: 'string',
					},
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		emojis: {
			type: 'array',
			items: {
				type: 'string',
			},
		},
	},
	required: ['emojis'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.emojiMutesRepository)
		private emojiMutesRepository: EmojiMutesRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const emojiMutes = await this.emojiMutesRepository.findOne({
				where: {
					userId: me.id,
				},
			});
			if (emojiMutes == null) {
				const result = await this.emojiMutesRepository.insertOne({
					id: this.idService.gen(),
					userId: me.id,
					emojis: ps.emojis,
				});

				return result.emojis;
			} else {
				await this.emojiMutesRepository.update(emojiMutes.id, {
					emojis: ps.emojis,
				});

				return ps.emojis;
			}
		});
	}
}
