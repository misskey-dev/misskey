/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { UserPollsRepository, UserPollVotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';

export const meta = {
	tags: ['user-polls'],

	requireCredential: true,
	kind: 'read:user-polls',

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
				voted: { type: 'boolean', optional: false, nullable: false },
				myChoiceIndex: { type: 'number', optional: true, nullable: true },
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
		offset: { type: 'integer', default: 0 },
		onlyUnvoted: { type: 'boolean', default: false },
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
		super(meta, paramDef, async (ps, me) => {
			const query = this.userPollsRepository.createQueryBuilder('poll')
				.where('poll.isActive = true')
				.orderBy('poll.id', 'DESC')
				.limit(ps.limit)
				.offset(ps.offset);

			const polls = await query.getMany();

			const results = await Promise.all(polls.map(async (poll) => {
				const myVote = await this.userPollVotesRepository.findOneBy({
					pollId: poll.id,
					userId: me.id,
				});

				return {
					id: poll.id,
					createdAt: this.idService.parse(poll.id).date.toISOString(),
					question: poll.question,
					choices: poll.choices,
					isAnonymous: poll.isAnonymous,
					deadline: poll.deadline?.toISOString() ?? null,
					voted: myVote != null,
					myChoiceIndex: poll.isAnonymous ? null : (myVote?.choiceIndex ?? null),
				};
			}));

			if (ps.onlyUnvoted) {
				return results.filter(p => !p.voted);
			}

			return results;
		});
	}
}
