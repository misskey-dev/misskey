import * as Koa from 'koa';
import { Users, UserPendings, UserProfiles } from '@/models/index';
import { signup } from '../common/signup';
import signin from '../common/signin';

export default async (ctx: Koa.Context) => {
	const body = ctx.request.body;

	const code = body['code'];

	try {
		const pendingUser = await UserPendings.findOneOrFail({ code });

		const { account, secret } = await signup({
			username: pendingUser.username,
			passwordHash: pendingUser.password,
		});

		UserPendings.delete({
			id: pendingUser.id,
		});

		const profile = await UserProfiles.findOneOrFail(account.id);

		await UserProfiles.update({ userId: profile.userId }, {
			email: pendingUser.email,
			emailVerified: true,
			emailVerifyCode: null,
		});

		signin(ctx, account);
	} catch (e) {
		ctx.throw(400, e);
	}
};
