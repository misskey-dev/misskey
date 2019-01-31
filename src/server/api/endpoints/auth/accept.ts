import rndstr from 'rndstr';
import * as crypto from 'crypto';
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

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	// Fetch token
	const session = await AuthSess
		.findOne({ token: ps.token });

	if (session === null) {
		return rej('session not found');
	}

	// Generate access token
	const accessToken = rndstr('a-zA-Z0-9', 32);

	// Fetch exist access token
	const exist = await AccessToken.findOne({
		appId: session.appId,
		userId: user._id,
	});

	if (exist === null) {
		// Lookup app
		const app = await App.findOne({
			_id: session.appId
		});

		// Generate Hash
		const sha256 = crypto.createHash('sha256');
		sha256.update(accessToken + app.secret);
		const hash = sha256.digest('hex');

		// Insert access token doc
		await AccessToken.insert({
			createdAt: new Date(),
			appId: session.appId,
			userId: user._id,
			token: accessToken,
			hash: hash
		});
	}

	// Update session
	await AuthSess.update(session._id, {
		$set: {
			userId: user._id
		}
	});

	// Response
	res();
}));
