/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { EmojiMutesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';

// TODO: UserWebhook schemaの適用
export const meta = {
	tags: ['emoji', 'mute'],

	requireCredential: true,

	kind: 'read:account',

	res: {
		type: 'array',
		items: {
			type: 'string',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.emojiMutesRepository)
		private emojiMutesRepository: EmojiMutesRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const emojiMutes = await this.emojiMutesRepository.findOne({
				where: {
					userId: me.id,
				},
			});

			return emojiMutes?.emojis ?? [];
		});
	}
}
