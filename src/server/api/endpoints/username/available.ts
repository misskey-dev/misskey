import $ from 'cafy';
import define from '../../define';
import { Users, UsedUsernames } from '../../../../models';

export const meta = {
	desc: {
		'ja-JP': 'ユーザーネームが使用されていないかをチェックします。',
		'en-US': 'Check if the username is being used.'
	},

	tags: ['users'],

	requireCredential: false as const,

	params: {
		username: {
			validator: $.use(Users.validateLocalUsername)
		}
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			available: {
				type: 'boolean' as const,
				optional: false as const, nullable: false as const,
				description: 'Returns true if the username is not used.'
			}
		}
	}
};

export default define(meta, async (ps) => {
	// Get exist
	const exist = await Users.count({
		host: null,
		usernameLower: ps.username.toLowerCase()
	});

	const exist2 = await UsedUsernames.count({ username: ps.username.toLowerCase() });

	return {
		available: exist === 0 && exist2 === 0
	};
});
