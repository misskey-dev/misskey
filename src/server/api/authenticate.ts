import App, { IApp } from '../../models/entities/app';
import { default as User, User } from '../../models/entities/user';
import AccessToken from '../../models/entities/access-token';
import isNativeToken from './common/is-native-token';

export default async (token: string): Promise<[User, IApp]> => {
	if (token == null) {
		return [null, null];
	}

	if (isNativeToken(token)) {
		// Fetch user
		const user: User = await User
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
