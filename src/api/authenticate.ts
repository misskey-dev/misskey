import * as express from 'express';
import App from './models/app';
import User from './models/user';
import Userkey from './models/userkey';

export interface IAuthContext {
	/**
	 * App which requested
	 */
	app: any;

	/**
	 * Authenticated user
	 */
	user: any;

	/**
	 * Weather if the request is via the (Misskey Web Client or user direct) or not
	 */
	isSecure: boolean;
}

export default (req: express.Request) => new Promise<IAuthContext>(async (resolve, reject) => {
	const token = req.body['i'] || req.body['_userkey']; // そのうち_userkeyは削除

	if (token == null) {
		return resolve({ app: null, user: null, isSecure: false });
	}

	if (token[0] == '!') {
		const user = await User
			.findOne({ token: token });

		if (user === null) {
			return reject('user not found');
		}

		return resolve({
			app: null,
			user: user,
			isSecure: true
		});
	} else {
		const userkeyDoc = await Userkey.findOne({
			key: token
		});

		if (userkeyDoc === null) {
			return reject('invalid userkey');
		}

		const app = await App
			.findOne({ _id: userkeyDoc.app_id });

		const user = await User
			.findOne({ _id: userkeyDoc.user_id });

		return resolve({ app: app, user: user, isSecure: false });
	}
});
