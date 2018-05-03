import App, { IApp } from '../../models/app';
import { default as User, IUser } from '../../models/user';
import AccessToken from '../../models/access-token';
import isNativeToken from './common/is-native-token';

export default (token: string) => new Promise<[IUser, IApp]>(async (resolve, reject) => {
	if (token == null) {
		resolve([null, null]);
		return;
	}

	if (isNativeToken(token)) {
		// Fetch user
		const user: IUser = await User
			.findOne({ token });

		if (user === null) {
			return reject('user not found');
		}

		resolve([user, null]);
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

		resolve([user, app]);
	}
});
