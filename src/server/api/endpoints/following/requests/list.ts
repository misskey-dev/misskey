import define from '../../../define';
import { FollowRequests } from '../../../../../models';

export const meta = {
	tags: ['following', 'account'],

	requireCredential: true as const,

	kind: 'read:following',

	res: {
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
				follower: {
					type: 'object' as const,
					optional: false as const, nullable: false as const,
					ref: 'User'
				},
				followee: {
					type: 'object' as const,
					optional: false as const, nullable: false as const,
					ref: 'User'
				}
			}
		}
	}
};

export default define(meta, async (ps, user) => {
	const reqs = await FollowRequests.find({
		followeeId: user.id
	});

	return await Promise.all(reqs.map(req => FollowRequests.pack(req)));
});
