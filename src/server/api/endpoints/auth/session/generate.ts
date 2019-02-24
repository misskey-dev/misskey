import * as uuid from 'uuid';
import $ from 'cafy';
import App from '../../../../../models/app';
import AuthSess from '../../../../../models/auth-session';
import config from '../../../../../config';
import define from '../../../define';
import { ApiError } from '../../../error';

export const meta = {
	tags: ['auth'],

	requireCredential: false,

	params: {
		appSecret: {
			validator: $.str,
			desc: {
				'ja-JP': 'アプリケーションのシークレットキー',
				'en-US': 'The secret key of your application.'
			}
		}
	},

	errors: {
		noSuchApp: {
			message: 'No such app.',
			code: 'NO_SUCH_APP',
			id: '92f93e63-428e-4f2f-a5a4-39e1407fe998'
		}
	}
};

export default define(meta, async (ps) => {
	// Lookup app
	const app = await App.findOne({
		secret: ps.appSecret
	});

	if (app == null) {
		throw new ApiError(meta.errors.noSuchApp);
	}

	// Generate token
	const token = uuid.v4();

	// Create session token document
	const doc = await AuthSess.insert({
		createdAt: new Date(),
		appId: app._id,
		token: token
	});

	return {
		token: doc.token,
		url: `${config.authUrl}/${doc.token}`
	};
});
