/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { UserPollsRepository, UserPollVotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['user-polls'],

	requireCredential: true,
	kind: 'write:user-polls',

	errors: {
		noSuchPoll: {
			message: 'No such poll.',
			code: 'NO_SUCH_POLL',
			id: 'c7d5e3f4-4a6b-5c0d-9e2f-3a4b5c6d7e8f',
		},
		pollClosed: {
			message: 'Poll is closed.',
			code: 'POLL_CLOSED',
			id: 'd8e6f4a5-5b7c-6d1e-0f3a-4b5c6d7e8f9a',
		},
		alreadyVoted: {
			message: 'Already voted.',
			code: 'ALREADY_VOTED',
			id: 'e9f7a5b6-6c8d-7e2f-1a4b-5c6d7e8f9a0b',
		},
		invalidChoice: {
			message: 'Invalid choice index.',
			code: 'INVALID_CHOICE',
			id: 'f0a8b6c7-7d9e-8f3a-2b5c-6d7e8f9a0b1c',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		pollId: { type: 'string', format: 'misskey:id' },
		choiceIndex: { type: 'integer', minimum: 0 },
	},
	required: ['pollId', 'choiceIndex'],
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
			const poll = await this.userPollsRepository.findOneBy({ id: ps.pollId });
			if (poll == null) throw new ApiError(meta.errors.noSuchPoll);
			if (!poll.isActive) throw new ApiError(meta.errors.pollClosed);
			if (poll.deadline && poll.deadline < new Date()) throw new ApiError(meta.errors.pollClosed);
			if (ps.choiceIndex < 0 || ps.choiceIndex >= poll.choices.length) throw new ApiError(meta.errors.invalidChoice);

			const existing = await this.userPollVotesRepository.findOneBy({
				pollId: poll.id,
				userId: me.id,
			});
			if (existing != null) throw new ApiError(meta.errors.alreadyVoted);

			await this.userPollVotesRepository.insertOne({
				id: this.idService.gen(),
				pollId: poll.id,
				userId: me.id,
				choiceIndex: ps.choiceIndex,
			});
		});
	}
}
