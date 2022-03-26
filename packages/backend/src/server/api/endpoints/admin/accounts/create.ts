import define from '../../../define.js';
import { Users } from '@/models/index.js';
import { signup } from '../../../common/signup.js';
import { IsNull } from 'typeorm';

export const meta = {
	tags: ['admin'],

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

export const paramDef = {
	type: 'object',
	properties: {
		username: Users.localUsernameSchema,
		password: Users.passwordSchema,
	},
	required: ['username', 'password'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, _me) => {
	const me = _me ? await Users.findOneByOrFail({ id: _me.id }) : null;
	const noUsers = (await Users.countBy({
		host: IsNull(),
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
