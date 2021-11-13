import $ from 'cafy';
import define from '../../define';
import { ID } from '@/misc/cafy-id';
import { Users } from '@/models/index';

export const meta = {
	tags: ['users'],

	requireCredential: true as const,

	params: {
		userId: {
			validator: $.either($.type(ID), $.arr($.type(ID)).unique()),
		}
	},

	res: {
		oneOf: [
			{
				type: 'object' as const,
				optional: false as const, nullable: false as const,
				properties: {
					id: {
						type: 'string' as const,
						optional: false as const, nullable: false as const,
						format: 'id'
					},
					isFollowing: {
						type: 'boolean' as const,
						optional: false as const, nullable: false as const
					},
					hasPendingFollowRequestFromYou: {
						type: 'boolean' as const,
						optional: false as const, nullable: false as const
					},
					hasPendingFollowRequestToYou: {
						type: 'boolean' as const,
						optional: false as const, nullable: false as const
					},
					isFollowed: {
						type: 'boolean' as const,
						optional: false as const, nullable: false as const
					},
					isBlocking: {
						type: 'boolean' as const,
						optional: false as const, nullable: false as const
					},
					isBlocked: {
						type: 'boolean' as const,
						optional: false as const, nullable: false as const
					},
					isMuted: {
						type: 'boolean' as const,
						optional: false as const, nullable: false as const
					}
				}
			},
			{
				type: 'array' as const,
				optional: false as const, nullable: false as const,
				items: {
					type: 'object' as const,
					optional: false as const, nullable: false as const,
					properties: {
						id: {
							type: 'string' as const,
							optional: false as const, nullable: false as const,
							format: 'id'
						},
						isFollowing: {
							type: 'boolean' as const,
							optional: false as const, nullable: false as const
						},
						hasPendingFollowRequestFromYou: {
							type: 'boolean' as const,
							optional: false as const, nullable: false as const
						},
						hasPendingFollowRequestToYou: {
							type: 'boolean' as const,
							optional: false as const, nullable: false as const
						},
						isFollowed: {
							type: 'boolean' as const,
							optional: false as const, nullable: false as const
						},
						isBlocking: {
							type: 'boolean' as const,
							optional: false as const, nullable: false as const
						},
						isBlocked: {
							type: 'boolean' as const,
							optional: false as const, nullable: false as const
						},
						isMuted: {
							type: 'boolean' as const,
							optional: false as const, nullable: false as const
						}
					}
				}
			}
		]
	}
};

export default define(meta, async (ps, me) => {
	const ids = Array.isArray(ps.userId) ? ps.userId : [ps.userId];

	const relations = await Promise.all(ids.map(id => Users.getRelation(me.id, id)));

	return Array.isArray(ps.userId) ? relations : relations[0];
});
