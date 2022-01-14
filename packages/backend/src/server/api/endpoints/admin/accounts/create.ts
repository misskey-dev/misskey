import define from '../../../define';
import { Users } from '@/models/index';
import { signup } from '../../../common/signup';

export const meta = {
	tags: ['admin'],

	params: {
		username: {
			validator: Users.validateLocalUsername,
		},

		password: {
			validator: Users.validatePassword,
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'User',
		properties: {
			token: {
				type: 'string',
				optional: false, nullable: false,
			},
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, _me) => {
	const me = _me ? await Users.findOneOrFail(_me.id) : null;
	const noUsers = (await Users.count({
		host: null,
	})) === 0;
	if (!noUsers && !me?.isAdmin) throw new Error('access denied');

	const { account, secret } = await signup({
		username: ps.username,
		password: ps.password,
	});

	const res = await Users.pack(account, account, {
		detail: true,
		includeSecrets: true,
	});

	(res as any).token = secret;

	return res;
});
