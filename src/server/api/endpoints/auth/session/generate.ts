/**
 * Module dependencies
 */
import * as uuid from 'uuid';
import $ from 'cafy';
import App from '../../../../../models/app';
import AuthSess from '../../../../../models/auth-session';
import config from '../../../../../config';

/**
 * Generate a session
 *
 * @param {any} params
 * @return {Promise<any>}
 */
export default (params: any) => new Promise(async (res, rej) => {
	// Get 'appSecret' parameter
	const [appSecret, appSecretErr] = $.str.get(params.appSecret);
	if (appSecretErr) return rej('invalid appSecret param');

	// Lookup app
	const app = await App.findOne({
		secret: appSecret
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
});
