/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { UserPollsRepository, UserPollVotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:user-polls',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			id: { type: 'string', optional: false, nullable: false, format: 'id' },
			question: { type: 'string', optional: false, nullable: false },
			isAnonymous: { type: 'boolean', optional: false, nullable: false },
			totalVotes: { type: 'number', optional: false, nullable: false },
			choices: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'object',
					properties: {
						index: { type: 'number', optional: false, nullable: false },
						text: { type: 'string', optional: false, nullable: false },
						votes: { type: 'number', optional: false, nullable: false },
					},
				},
			},
		},
	},

	errors: {
		noSuchPoll: {
			message: 'No such poll.',
			code: 'NO_SUCH_POLL',
			id: 'b6c4d2e3-3f5a-4b9c-8d1e-2f3a4b5c6d7f',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		pollId: { type: 'string', format: 'misskey:id' },
	},
	required: ['pollId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.userPollsRepository)
		private userPollsRepository: UserPollsRepository,

		@Inject(DI.userPollVotesRepository)
		private userPollVotesRepository: UserPollVotesRepository,
	) {
		super(meta, paramDef, async (ps) => {
			const poll = await this.userPollsRepository.findOneBy({ id: ps.pollId });
			if (poll == null) throw new ApiError(meta.errors.noSuchPoll);

			const votes = await this.userPollVotesRepository.findBy({ pollId: poll.id });

			const choiceVotes = poll.choices.map((text, index) => ({
				index,
				text,
				votes: votes.filter(v => v.choiceIndex === index).length,
			}));

			return {
				id: poll.id,
				question: poll.question,
				isAnonymous: poll.isAnonymous,
				totalVotes: votes.length,
				choices: choiceVotes,
			};
		});
	}
}
