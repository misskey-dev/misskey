import isNativeToken from './common/is-native-token';
import { User } from '~/models/entities/user';
import { App } from '~/models/entities/app';
import { Users, AccessTokens, Apps } from '~/models';

export default async (token: string): Promise<[User | null | undefined, App | null | undefined]> => {
	if (token == null) {
		return [null, null];
	}

	if (isNativeToken(token)) {
		// Fetch user
		const user = await Users
			.findOne({ token });

		if (user == null) {
			throw new Error('user not found');
		}

		return [user, null];
	} else {
		const accessToken = await AccessTokens.findOne({
			hash: token.toLowerCase()
		});

		if (accessToken == null) {
			throw new Error('invalid signature');
		}

		const app = await Apps
			.findOne(accessToken.appId);

		const user = await Users
			.findOne({
				id: accessToken.userId // findOne(accessToken.userId) のように書かないのは後方互換性のため
			});

		return [user, app];
	}
};
