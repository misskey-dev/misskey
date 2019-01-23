import App, { IApp } from '../../models/app';
import { default as User, IUser } from '../../models/user';
import AccessToken from '../../models/access-token';
import isNativeToken from './common/is-native-token';

export default async (token: string): Promise<[IUser, IApp]> => {
	if (token == null) {
		return [null, null];
	}

	if (isNativeToken(token)) {
		// Fetch user
		const user: IUser = await User
			.findOne({ token });

		if (user === null) {
			throw 'user not found';
		}

		return [user, null];
	} else {
		const accessToken = await AccessToken.findOne({
			hash: token.toLowerCase()
		});

		if (accessToken === null) {
			throw 'invalid signature';
		}

		const app = await App
			.findOne({ _id: accessToken.appId });

		const user = await User
			.findOne({ _id: accessToken.userId });

		return [user, app];
	}
};
