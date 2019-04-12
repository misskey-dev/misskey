import isNativeToken from './common/is-native-token';
import { User } from '../../models/entities/user';
import { App } from '../../models/entities/app';
import { Users, AccessTokens, Apps } from '../../models';

export default async (token: string): Promise<[User | null, App | null]> => {
	if (token == null) {
		return [null, null];
	}

	if (isNativeToken(token)) {
		// Fetch user
		const user = await Users
			.findOne({ token });

		if (user == null) {
			throw 'user not found';
		}

		return [user, null];
	} else {
		const accessToken = await AccessTokens.findOne({
			hash: token.toLowerCase()
		});

		if (accessToken == null) {
			throw 'invalid signature';
		}

		const app = await Apps
			.findOne(accessToken.appId);

		const user = await Users
			.findOne(accessToken.userId);

		return [user, app];
	}
};
