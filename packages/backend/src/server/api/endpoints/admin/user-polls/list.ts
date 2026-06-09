/*
 * SPDX-FileCopyrightText: Rickskey Project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { UserPollsRepository, UserPollVotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:user-polls',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				id: { type: 'string', optional: false, nullable: false, format: 'id' },
				createdAt: { type: 'string', optional: false, nullable: false, format: 'date-time' },
				question: { type: 'string', optional: false, nullable: false },
				choices: { type: 'array', optional: false, nullable: false, items: { type: 'string' } },
				isAnonymous: { type: 'boolean', optional: false, nullable: false },
				deadline: { type: 'string', optional: false, nullable: true, format: 'date-time' },
				isActive: { type: 'boolean', optional: false, nullable: false },
				voteCount: { type: 'number', optional: false, nullable: false },
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
		offset: { type: 'integer', default: 0 },
		status: { type: 'string', enum: ['all', 'active', 'closed'], default: 'all' },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.userPollsRepository)
		private userPollsRepository: UserPollsRepository,

		@Inject(DI.userPollVotesRepository)
		private userPollVotesRepository: UserPollVotesRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps) => {
			const query = this.userPollsRepository.createQueryBuilder('poll')
				.orderBy('poll.id', 'DESC')
				.limit(ps.limit)
				.offset(ps.offset);

			if (ps.status === 'active') {
				query.andWhere('poll.isActive = true');
			} else if (ps.status === 'closed') {
				query.andWhere('poll.isActive = false');
			}

			const polls = await query.getMany();

			const results = await Promise.all(polls.map(async (poll) => {
				const voteCount = await this.userPollVotesRepository.countBy({ pollId: poll.id });
				return {
					id: poll.id,
					createdAt: this.idService.parse(poll.id).date.toISOString(),
					question: poll.question,
					choices: poll.choices,
					isAnonymous: poll.isAnonymous,
					deadline: poll.deadline?.toISOString() ?? null,
					isActive: poll.isActive,
					voteCount,
				};
			}));

			return results;
		});
	}
}
