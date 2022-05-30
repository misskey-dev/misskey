import { Signins, UserProfiles, Users } from '@/models/index.js';
import define from '../../define.js';

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
export default define(meta, paramDef, async (ps, me) => {
	const [user, profile] = await Promise.all([
		Users.findOneBy({ id: ps.userId }),
		UserProfiles.findOneBy({ userId: ps.userId })
	]);

	if (user == null || profile == null) {
		throw new Error('user not found');
	}

	const _me = await Users.findOneByOrFail({ id: me.id });
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

	const signins = await Signins.findBy({ userId: user.id });

	return {
		email: profile.email,
		emailVerified: profile.emailVerified,
		autoAcceptFollowed: profile.autoAcceptFollowed,
		noCrawle: profile.noCrawle,
		alwaysMarkNsfw: profile.alwaysMarkNsfw,
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
		signins,
	};
});
