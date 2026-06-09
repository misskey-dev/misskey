/*
 * SPDX-FileCopyrightText: Rickskey Project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { EmojiProposalsRepository, EmojiProposalVotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';

export const meta = {
	tags: ['emoji-proposals'],
	requireCredential: false,
	kind: 'read:emoji-proposals',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				id: { type: 'string', optional: false, nullable: false },
				createdAt: { type: 'string', optional: false, nullable: false },
				proposedById: { type: 'string', optional: false, nullable: false },
				name: { type: 'string', optional: false, nullable: false },
				imageUrl: { type: 'string', optional: false, nullable: false },
				category: { type: 'string', optional: true, nullable: true },
				description: { type: 'string', optional: true, nullable: true },
				status: { type: 'string', optional: false, nullable: false },
				voteCount: { type: 'number', optional: false, nullable: false },
				voted: { type: 'boolean', optional: false, nullable: false },
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'all'], default: 'pending' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 30 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
	},
	required: [],
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
			const query = this.emojiProposalsRepository.createQueryBuilder('proposal')
				.orderBy('proposal.id', 'DESC')
				.limit(ps.limit);

			if (ps.status !== 'all') {
				query.where('proposal.status = :status', { status: ps.status });
			}

			if (ps.sinceId) query.andWhere('proposal.id > :sinceId', { sinceId: ps.sinceId });
			if (ps.untilId) query.andWhere('proposal.id < :untilId', { untilId: ps.untilId });

			const proposals = await query.getMany();

			const votedIds = me ? new Set(
				(await this.emojiProposalVotesRepository.findBy({ userId: me.id })).map(v => v.proposalId),
			) : new Set<string>();

			return proposals.map(p => ({
				id: p.id,
				createdAt: this.idService.parse(p.id).date.toISOString(),
				proposedById: p.proposedById,
				name: p.name,
				imageUrl: p.imageUrl,
				category: p.category ?? null,
				description: p.description ?? null,
				status: p.status,
				voteCount: p.voteCount,
				voted: votedIds.has(p.id),
			}));
		});
	}
}
