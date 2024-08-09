import { Inject, Injectable } from '@nestjs/common';
import type { UserBannerRepository, UsersRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:unset-user-mutual-banner',
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userBannerRepository)
		private userBannerRepository: UserBannerRepository,
		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const user = await this.usersRepository.findOneBy({ id: ps.userId });

			if (user == null) {
				throw new Error('user not found');
			}

			const mutualBanner = await this.userBannerRepository.findOneBy({ userId: user.id });

			if (mutualBanner == null) return;

			await this.userBannerRepository.delete({
				id: mutualBanner.id,
			});

			this.moderationLogService.log(me, 'unsetUserMutualBanner', {
				userId: user.id,
				userUsername: user.username,
				userBannerDescription: mutualBanner.description,
				userBannerUrl: mutualBanner.url,
				fileId: mutualBanner.fileId,
			});
		});
	}
}
