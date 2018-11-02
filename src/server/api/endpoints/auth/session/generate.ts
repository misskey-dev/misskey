import * as uuid from 'uuid';
import $ from 'cafy';
import App from '../../../../../models/app';
import AuthSess from '../../../../../models/auth-session';
import config from '../../../../../config';
import define from '../../../define';

export const meta = {
	requireCredential: false,

	params: {
		appSecret: {
			validator: $.str
		}
	}
};

export default define(meta, (ps) => new Promise(async (res, rej) => {
	// Lookup app
	const app = await App.findOne({
		secret: ps.appSecret
	});

	if (app == null) {
		return rej('app not found');
	}

	// Generate token
	const token = uuid.v4();

	// Create session token document
	const doc = await AuthSess.insert({
		createdAt: new Date(),
		appId: app._id,
		token: token
	});

	// Response
	res({
		token: doc.token,
		url: `${config.auth_url}/${doc.token}`
	});
}));
