import $ from 'cafy';
import define from '../../define';
import { Users, UsedUsernames } from '@/models/index';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	params: {
		username: {
			validator: $.use(Users.validateLocalUsername),
		},
	},

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

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps) => {
	// Get exist
	const exist = await Users.count({
		host: null,
		usernameLower: ps.username.toLowerCase(),
	});

	const exist2 = await UsedUsernames.count({ username: ps.username.toLowerCase() });

	return {
		available: exist === 0 && exist2 === 0,
	};
});
