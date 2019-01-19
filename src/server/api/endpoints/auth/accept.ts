import rndstr from 'rndstr';
import { createHash } from 'crypto';
import $ from 'cafy';
import App from '../../../../models/app';
import AuthSess from '../../../../models/auth-session';
import AccessToken from '../../../../models/access-token';
import define from '../../define';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		token: {
			validator: $.str
		}
	}
};

export default define(meta, (ps, user) => AuthSess.findOne({ token: ps.token })
	.then(async session => {
		if (session === null) throw 'session not found';
		if (await AccessToken.findOne({
			appId: session.appId,
			userId: user._id,
		}) === null) await App.findOne({ _id: session.appId })
			.then(x => {
				const token = rndstr('a-zA-Z0-9', 32);
				return AccessToken.insert({
					createdAt: new Date(),
					appId: session.appId,
					userId: user._id,
					token,
					hash: createHash('sha256').update(token + x.secret).digest('hex')
				});
			});
		return session;
	})
	.then(x => AuthSess.update(x._id, {
		$set: { userId: user._id }
	}))
	.then(() => {}));
