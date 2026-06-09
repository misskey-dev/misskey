/*
 * SPDX-FileCopyrightText: Rickskey Project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { EmojiProposalsRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';

export const meta = {
	tags: ['emoji-proposals'],
	requireCredential: true,
	kind: 'write:emoji-proposals',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			id: { type: 'string', optional: false, nullable: false },
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string', minLength: 1, maxLength: 64, pattern: '^[a-zA-Z0-9_]+$' },
		imageUrl: { type: 'string', minLength: 1, maxLength: 512 },
		category: { type: 'string', maxLength: 512, nullable: true, default: null },
		description: { type: 'string', maxLength: 1024, nullable: true, default: null },
	},
	required: ['name', 'imageUrl'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.emojiProposalsRepository)
		private emojiProposalsRepository: EmojiProposalsRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const proposal = await this.emojiProposalsRepository.insertOne({
				id: this.idService.gen(),
				proposedById: me.id,
				name: ps.name,
				imageUrl: ps.imageUrl,
				category: ps.category ?? null,
				description: ps.description ?? null,
				status: 'pending',
				voteCount: 0,
			});

			return { id: proposal.id };
		});
	}
}
