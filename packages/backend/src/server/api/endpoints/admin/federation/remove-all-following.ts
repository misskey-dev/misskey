import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { FollowingsRepository, UsersRepository } from '@/models/index.js';
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

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
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
			])));

			this.queueService.createUnfollowJob(pairs.map(p => ({ to: p[0], from: p[1], silent: true })));
		});
	}
}
