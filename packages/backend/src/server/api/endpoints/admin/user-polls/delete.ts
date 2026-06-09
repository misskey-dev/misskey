/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { UserPollsRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:user-polls',

	errors: {
		noSuchPoll: {
			message: 'No such poll.',
			code: 'NO_SUCH_POLL',
			id: 'a5b3f0c1-2d4e-4f8b-9c0d-1e2a3b4c5d6e',
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
	) {
		super(meta, paramDef, async (ps) => {
			const poll = await this.userPollsRepository.findOneBy({ id: ps.pollId });
			if (poll == null) throw new ApiError(meta.errors.noSuchPoll);

			await this.userPollsRepository.delete(poll.id);
		});
	}
}
