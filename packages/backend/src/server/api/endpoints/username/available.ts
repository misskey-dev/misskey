import define from '../../define.js';
import { Users, UsedUsernames } from '@/models/index.js';
import { IsNull } from 'typeorm';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			available: {
				type: 'boolean',
				optional: false, nullable: false,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		username: Users.localUsernameSchema,
	},
	required: ['username'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps) => {
	// Get exist
	const exist = await Users.countBy({
		host: IsNull(),
		usernameLower: ps.username.toLowerCase(),
	});

	const exist2 = await UsedUsernames.countBy({ username: ps.username.toLowerCase() });

	return {
		available: exist === 0 && exist2 === 0,
	};
});
