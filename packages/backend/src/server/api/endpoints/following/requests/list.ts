import define from '../../../define.js';
import { FollowRequests } from '@/models/index.js';

export const meta = {
	tags: ['following', 'account'],

	requireCredential: true,

	kind: 'read:following',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				id: {
					type: 'string',
					optional: false, nullable: false,
					format: 'id',
				},
				follower: {
					type: 'object',
					optional: false, nullable: false,
					ref: 'UserLite',
				},
				followee: {
					type: 'object',
					optional: false, nullable: false,
					ref: 'UserLite',
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const reqs = await FollowRequests.findBy({
		followeeId: user.id,
	});

	return await Promise.all(reqs.map(req => FollowRequests.pack(req)));
});
