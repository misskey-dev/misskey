/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { FollowingsRepository, UsersRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { QueueService } from '@/core/QueueService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		host: { type: 'string' },
	},
	required: ['host'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private followingsRepository: FollowingsRepository,

		private queueService: QueueService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const followings = await this.followingsRepository.findBy({
				followerHost: ps.host,
			});

			const pairs = await Promise.all(followings.map(f => Promise.all([
				this.usersRepository.findOneByOrFail({ id: f.followerId }),
				this.usersRepository.findOneByOrFail({ id: f.followeeId }),
			]).then(([from, to]) => [{ id: from.id }, { id: to.id }])));

			this.queueService.createUnfollowJob(pairs.map(p => ({ from: p[0], to: p[1], silent: true })));
		});
	}
}
