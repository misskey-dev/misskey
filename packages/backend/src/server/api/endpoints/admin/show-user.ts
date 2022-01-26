import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { Users } from '@/models/index';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		userId: {
			validator: $.type(ID),
		},
	},

	res: {
		type: 'object',
		nullable: false, optional: false,
		properties: {
			id: {
				type: 'string',
				nullable: false, optional: false,
				format: 'id',
			},
			createdAt: {
				type: 'string',
				nullable: false, optional: false,
				format: 'date-time',
			},
			updatedAt: {
				type: 'string',
				nullable: true, optional: false,
				format: 'date-time',
			},
			lastFetchedAt: {
				type: 'string',
				nullable: true, optional: false,
			},
			username: {
				type: 'string',
				nullable: false, optional: false,
			},
			name: {
				type: 'string',
				nullable: true, optional: false,
			},
			folowersCount: {
				type: 'number',
				nullable: false, optional: true,
			},
			followingCount: {
				type: 'number',
				nullable: false, optional: false,
			},
			notesCount: {
				type: 'number',
				nullable: false, optional: false,
			},
			avatarId: {
				type: 'string',
				nullable: true, optional: false,
			},
			bannerId: {
				type: 'string',
				nullable: true, optional: false,
			},
			tags: {
				type: 'array',
				nullable: false, optional: false,
				items: {
					type: 'string',
					nullable: false, optional: false,
				},
			},
			avatarUrl: {
				type: 'string',
				nullable: true, optional: false,
				format: 'url',
			},
			bannerUrl: {
				type: 'string',
				nullable: true, optional: false,
				format: 'url',
			},
			avatarBlurhash: {
				type: 'any',
				nullable: true, optional: false,
				default: null,
			},
			bannerBlurhash: {
				type: 'any',
				nullable: true, optional: false,
				default: null,
			},
			isSuspended: {
				type: 'boolean',
				nullable: false, optional: false,
			},
			isSilenced: {
				type: 'boolean',
				nullable: false, optional: false,
			},
			isLocked: {
				type: 'boolean',
				nullable: false, optional: false,
			},
			isBot: {
				type: 'boolean',
				nullable: false, optional: false,
			},
			isCat: {
				type: 'boolean',
				nullable: false, optional: false,
			},
			isAdmin: {
				type: 'boolean',
				nullable: false, optional: false,
			},
			isModerator: {
				type: 'boolean',
				nullable: false, optional: false,
			},
			emojis: {
				type: 'array',
				nullable: false, optional: false,
				items: {
					type: 'string',
					nullable: false, optional: false,
				},
			},
			host: {
				type: 'string',
				nullable: true, optional: false,
			},
			inbox: {
				type: 'string',
				nullable: true, optional: false,
			},
			sharedInbox: {
				type: 'string',
				nullable: true, optional: false,
			},
			featured: {
				type: 'string',
				nullable: true, optional: false,
			},
			uri: {
				type: 'string',
				nullable: true, optional: false,
			},
			token: {
				type: 'string',
				nullable: true, optional: false,
				default: '<MASKED>',
			},
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
	const user = await Users.findOne(ps.userId as string);

	if (user == null) {
		throw new Error('user not found');
	}

	if ((me.isModerator && !me.isAdmin) && user.isAdmin) {
		throw new Error('cannot show info of admin');
	}

	return {
		...user,
		token: user.token != null ? '<MASKED>' : user.token,
	};
});
