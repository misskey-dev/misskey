import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { Users } from '../../../../models';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーの情報を取得します（管理者向け）。',
		'en-US': 'Gets the information of the specified user (for administrators).'
	},

	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		userId: {
			validator: $.type(ID),
			desc: {
				'ja-JP': '対象のユーザーID',
				'en-US': 'The user ID which you want to suspend'
			}
		},
	},

	res: {
		type: 'object' as const,
		nullable: false as const, optional: false as const,
		properties: {
			id: {
				type: 'string' as const,
				nullable: false as const, optional: false as const,
				format: 'id'
			},
			createdAt: {
				type: 'string' as const,
				nullable: false as const, optional: false as const,
				format: 'date-time'
			},
			updatedAt: {
				type: 'string' as const,
				nullable: true as const, optional: false as const,
				format: 'date-time'
			},
			lastFetchedAt: {
				type: 'string' as const,
				nullable: true as const, optional: false as const
			},
			username: {
				type: 'string' as const,
				nullable: false as const, optional: false as const
			},
			name: {
				type: 'string' as const,
				nullable: false as const, optional: false as const
			},
			folowersCount: {
				type: 'number' as const,
				nullable: false as const, optional: false as const
			},
			followingCount: {
				type: 'number' as const,
				nullable: false as const, optional: false as const
			},
			notesCount: {
				type: 'number' as const,
				nullable: false as const, optional: false as const
			},
			avatarId: {
				type: 'string' as const,
				nullable: true as const, optional: false as const
			},
			bannerId: {
				type: 'string' as const,
				nullable: true as const, optional: false as const
			},
			tags: {
				type: 'array' as const,
				nullable: false as const, optional: false as const,
				items: {
					type: 'string' as const,
					nullable: false as const, optional: false as const
				}
			},
			avatarUrl: {
				type: 'string' as const,
				nullable: true as const, optional: false as const,
				format: 'url'
			},
			bannerUrl: {
				type: 'string' as const,
				nullable: true as const, optional: false as const,
				format: 'url'
			},
			avatarBlurhash: {
				type: 'any' as const,
				nullable: true as const, optional: false as const,
				default: null
			},
			bannerBlurhash: {
				type: 'any' as const,
				nullable: true as const, optional: false as const,
				default: null
			},
			isSuspended: {
				type: 'boolean' as const,
				nullable: false as const, optional: false as const
			},
			isSilenced: {
				type: 'boolean' as const,
				nullable: false as const, optional: false as const
			},
			isLocked: {
				type: 'boolean' as const,
				nullable: false as const, optional: false as const,
			},
			isBot: {
				type: 'boolean' as const,
				nullable: false as const, optional: false as const
			},
			isCat: {
				type: 'boolean' as const,
				nullable: false as const, optional: false as const
			},
			isAdmin: {
				type: 'boolean' as const,
				nullable: false as const, optional: false as const
			},
			isModerator: {
				type: 'boolean' as const,
				nullable: false as const, optional: false as const
			},
			emojis: {
				type: 'array' as const,
				nullable: false as const, optional: false as const,
				items: {
					type: 'string' as const,
					nullable: false as const, optional: false as const
				}
			},
			host: {
				type: 'string' as const,
				nullable: true as const, optional: false as const
			},
			inbox: {
				type: 'string' as const,
				nullable: true as const, optional: false as const
			},
			sharedInbox: {
				type: 'string' as const,
				nullable: true as const, optional: false as const
			},
			featured: {
				type: 'string' as const,
				nullable: true as const, optional: false as const
			},
			uri: {
				type: 'string' as const,
				nullable: true as const, optional: false as const
			},
			token: {
				type: 'string' as const,
				nullable: false as const, optional: false as const,
				default: '<MASKED>'
			}
		}
	}
};

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
