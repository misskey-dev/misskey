/*
 * SPDX-FileCopyrightText: Rickskey Project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { CommunityChallengesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['admin'],
	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:challenges',

	errors: {
		noSuchChallenge: {
			message: 'No such challenge.',
			code: 'NO_SUCH_CHALLENGE',
			id: 'f7a8b9c0-d1e2-3456-abcd-456789012345',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		challengeId: { type: 'string', format: 'misskey:id' },
	},
	required: ['challengeId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.communityChallengesRepository)
		private communityChallengesRepository: CommunityChallengesRepository,
	) {
		super(meta, paramDef, async (ps) => {
			const challenge = await this.communityChallengesRepository.findOneBy({ id: ps.challengeId });
			if (challenge == null) throw new ApiError(meta.errors.noSuchChallenge);

			await this.communityChallengesRepository.delete(ps.challengeId);
		});
	}
}
