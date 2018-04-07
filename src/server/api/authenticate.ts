import * as express from 'express';
import App from '../../models/app';
import { default as User, IUser } from '../../models/user';
import AccessToken from '../../models/access-token';
import isNativeToken from './common/is-native-token';

export interface IAuthContext {
	/**
	 * App which requested
	 */
	app: any;

	/**
	 * Authenticated user
	 */
	user: IUser;

	/**
	 * Whether requested with a User-Native Token
	 */
	isSecure: boolean;
}

export default (req: express.Request) => new Promise<IAuthContext>(async (resolve, reject) => {
	const token = req.body['i'] as string;

	if (token == null) {
		return resolve({
			app: null,
			user: null,
			isSecure: false
		});
	}

	if (isNativeToken(token)) {
		const user: IUser = await User
			.findOne({ 'token': token });

		if (user === null) {
			return reject('user not found');
		}

		return resolve({
			app: null,
			user: user,
			isSecure: true
		});
	} else {
		const accessToken = await AccessToken.findOne({
			hash: token.toLowerCase()
		});

		if (accessToken === null) {
			return reject('invalid signature');
		}

		const app = await App
			.findOne({ _id: accessToken.appId });

		const user = await User
			.findOne({ _id: accessToken.userId });

		return resolve({
			app: app,
			user: user,
			isSecure: false
		});
	}
});
