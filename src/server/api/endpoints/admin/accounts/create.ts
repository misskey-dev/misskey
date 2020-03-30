import define from '../../../define';
import { Users } from '../../../../../models';
import { signup } from '../../../common/signup';

export const meta = {
	tags: ['admin'],

	params: {
		username: {
			validator: Users.validateLocalUsername,
		},

		password: {
			validator: Users.validatePassword,
		}
	}
};

export default define(meta, async (ps, me) => {
	const noUsers = (await Users.count({})) === 0;
	if (!noUsers && !me?.isAdmin) throw new Error('access denied');

	const { account, secret } = await signup(ps.username, ps.password);

	const res = await Users.pack(account, account, {
		detail: true,
		includeSecrets: true
	});

	(res as any).token = secret;

	return res;
});
