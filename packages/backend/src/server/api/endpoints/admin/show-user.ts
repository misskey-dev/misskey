import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository, SigninsRepository, UserProfilesRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	res: {
		type: 'object',
		nullable: false, optional: false,
	},
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

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.signinsRepository)
		private signinsRepository: SigninsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const [user, profile] = await Promise.all([
				this.usersRepository.findOneBy({ id: ps.userId }),
				this.userProfilesRepository.findOneBy({ userId: ps.userId }),
			]);

			if (user == null || profile == null) {
				throw new Error('user not found');
			}

			const _me = await this.usersRepository.findOneByOrFail({ id: me.id });
			if ((_me.isModerator && !_me.isAdmin) && user.isAdmin) {
				throw new Error('cannot show info of admin');
			}

			if (!_me.isAdmin) {
				return {
					isModerator: user.isModerator,
					isSilenced: user.isSilenced,
					isSuspended: user.isSuspended,
				};
			}

			const maskedKeys = ['accessToken', 'accessTokenSecret', 'refreshToken'];
			Object.keys(profile.integrations).forEach(integration => {
				maskedKeys.forEach(key => profile.integrations[integration][key] = '<MASKED>');
			});

			const signins = await this.signinsRepository.findBy({ userId: user.id });

			return {
				email: profile.email,
				emailVerified: profile.emailVerified,
				autoAcceptFollowed: profile.autoAcceptFollowed,
				noCrawle: profile.noCrawle,
				alwaysMarkNsfw: profile.alwaysMarkNsfw,
				autoSensitive: profile.autoSensitive,
				carefulBot: profile.carefulBot,
				injectFeaturedNote: profile.injectFeaturedNote,
				receiveAnnouncementEmail: profile.receiveAnnouncementEmail,
				integrations: profile.integrations,
				mutedWords: profile.mutedWords,
				mutedInstances: profile.mutedInstances,
				mutingNotificationTypes: profile.mutingNotificationTypes,
				isModerator: user.isModerator,
				isSilenced: user.isSilenced,
				isSuspended: user.isSuspended,
				lastActiveDate: user.lastActiveDate,
				moderationNote: profile.moderationNote,
				signins,
			};
		});
	}
}
