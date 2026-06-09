/*
 * SPDX-FileCopyrightText: Rickskey Project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { EmojiProposalsRepository, EmojiProposalVotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['emoji-proposals'],
	requireCredential: true,
	kind: 'write:emoji-proposals',

	errors: {
		noSuchProposal: {
			message: 'No such proposal.',
			code: 'NO_SUCH_PROPOSAL',
			id: 'a2b3c4d5-e6f7-8901-bcde-f12345678901',
		},
		alreadyVoted: {
			message: 'You have already voted.',
			code: 'ALREADY_VOTED',
			id: 'b3c4d5e6-f7a8-9012-cdef-012345678902',
		},
		notPending: {
			message: 'This proposal is not pending.',
			code: 'NOT_PENDING',
			id: 'c4d5e6f7-a8b9-0123-defa-123456789012',
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

		@Inject(DI.emojiProposalVotesRepository)
		private emojiProposalVotesRepository: EmojiProposalVotesRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const proposal = await this.emojiProposalsRepository.findOneBy({ id: ps.proposalId });
			if (proposal == null) throw new ApiError(meta.errors.noSuchProposal);
			if (proposal.status !== 'pending') throw new ApiError(meta.errors.notPending);

			const existing = await this.emojiProposalVotesRepository.findOneBy({
				proposalId: ps.proposalId,
				userId: me.id,
			});
			if (existing != null) throw new ApiError(meta.errors.alreadyVoted);

			await this.emojiProposalVotesRepository.insertOne({
				id: this.idService.gen(),
				proposalId: ps.proposalId,
				userId: me.id,
			});

			await this.emojiProposalsRepository.increment({ id: ps.proposalId }, 'voteCount', 1);
		});
	}
}
