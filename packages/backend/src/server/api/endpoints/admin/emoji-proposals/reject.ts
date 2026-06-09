/*
 * SPDX-FileCopyrightText: Rickskey Project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { EmojiProposalsRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['admin'],
	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:emoji-proposals',

	errors: {
		noSuchProposal: {
			message: 'No such proposal.',
			code: 'NO_SUCH_PROPOSAL',
			id: 'e6f7a8b9-c0d1-2345-fabc-345678901234',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		proposalId: { type: 'string', format: 'misskey:id' },
	},
	required: ['proposalId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.emojiProposalsRepository)
		private emojiProposalsRepository: EmojiProposalsRepository,
	) {
		super(meta, paramDef, async (ps) => {
			const proposal = await this.emojiProposalsRepository.findOneBy({ id: ps.proposalId });
			if (proposal == null) throw new ApiError(meta.errors.noSuchProposal);

			await this.emojiProposalsRepository.update(ps.proposalId, { status: 'rejected' });
		});
	}
}
