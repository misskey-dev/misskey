import isNativeToken from './common/is-native-token';
import { User } from '../../models/entities/user';
import { Users, AccessTokens, Apps } from '../../models';
import { AccessToken } from '../../models/entities/access-token';

const cache = {} as Record<string, User>;

export default async (token: string): Promise<[User | null | undefined, AccessToken | null | undefined]> => {
	if (token == null) {
		return [null, null];
	}

	if (isNativeToken(token)) {
		if (cache[token]) { // TODO: キャッシュされてから一定時間経過していたら破棄する
			return [cache[token], null];
		}

		// Fetch user
		const user = await Users
			.findOne({ token });

		if (user == null) {
			throw new Error('user not found');
		}

		cache[token] = user;

		return [user, null];
	} else {
		// TODO: cache
		const accessToken = await AccessTokens.findOne({
			where: [{
				hash: token.toLowerCase() // app
			}, {
				token: token // miauth
			}],
		});

		if (accessToken == null) {
			throw new Error('invalid signature');
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
