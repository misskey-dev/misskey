import isNativeToken from './common/is-native-token';
import { User } from '@/models/entities/user';
import { Users, AccessTokens, Apps } from '@/models/index';
import { AccessToken } from '@/models/entities/access-token';

export class AuthenticationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'AuthenticationError';
	}
}

export default async (token: string): Promise<[User | null | undefined, App | null | undefined]> => {
	if (token == null) {
		return [null, null];
	}

	if (isNativeToken(token)) {
		// Fetch user
		const user = await Users
			.findOne({ token });

		if (user == null) {
			throw new AuthenticationError('user not found');
		}

		return [user, null];
	} else {
		const accessToken = await AccessTokens.findOne({
			where: [{
				hash: token.toLowerCase() // app
			}, {
				token: token // miauth
			}],
		});

		if (accessToken == null) {
			throw new AuthenticationError('invalid signature');
		}

		AccessTokens.update(accessToken.id, {
			lastUsedAt: new Date(),
		});

		const user = await Users
			.findOne({
				id: accessToken.userId // findOne(accessToken.userId) のように書かないのは後方互換性のため
			});

		if (accessToken.appId) {
			const app = await Apps
				.findOneOrFail(accessToken.appId);

			return [user, {
				id: accessToken.id,
				permission: app.permission
			} as AccessToken];
		} else {
			return [user, accessToken];
		}
	}
};
