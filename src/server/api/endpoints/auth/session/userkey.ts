import $ from 'cafy';
import App from '../../../../../models/app';
import AuthSess from '../../../../../models/auth-session';
import AccessToken from '../../../../../models/access-token';
import { pack } from '../../../../../models/user';
import getParams from '../../../get-params';

export const meta = {
	requireCredential: false,

	params: {
		appSecret: {
			validator: $.str
		},

		token: {
			validator: $.str
		}
	}
};

export default (params: any) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	// Lookup app
	const app = await App.findOne({
		secret: ps.appSecret
	});

	if (app == null) {
		return rej('app not found');
	}

	// Fetch token
	const session = await AuthSess
		.findOne({
			token: ps.token,
			appId: app._id
		});

	if (session === null) {
		return rej('session not found');
	}

	if (session.userId == null) {
		return rej('this session is not allowed yet');
	}

	// Lookup access token
	const accessToken = await AccessToken.findOne({
		appId: app._id,
		userId: session.userId
	});

	// Delete session

	/* https://github.com/Automattic/monk/issues/178
	AuthSess.deleteOne({
		_id: session._id
	});
	*/
	AuthSess.remove({
		_id: session._id
	});

	// Response
	res({
		accessToken: accessToken.token,
		user: await pack(session.userId, null, {
			detail: true
		})
	});
});
