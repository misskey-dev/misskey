import * as ms from 'ms';
import $ from 'cafy';
import User, { pack, ILocalUser } from '../../../../models/user';
import { getFriendIds } from '../../common/get-friends';
import * as request from 'request-promise-native';
import config from '../../../../config';
import define from '../../define';
import fetchMeta from '../../../../misc/fetch-meta';
import resolveUser from '../../../../remote/resolve-user';
import { getHideUserIds } from '../../common/get-hide-users';
import { apiLogger } from '../../logger';

export const meta = {
	desc: {
		'ja-JP': 'おすすめのユーザー一覧を取得します。'
	},

	requireCredential: true,

	kind: 'account-read',

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		offset: {
			validator: $.optional.num.min(0),
			default: 0
		}
	}
};

export default define(meta, (ps, me) => new Promise(async (res, rej) => {
	const instance = await fetchMeta();

	if (instance.enableExternalUserRecommendation) {
		const userName = me.username;
		const hostName = config.hostname;
		const limit = ps.limit;
		const offset = ps.offset;
		const timeout = instance.externalUserRecommendationTimeout;
		const engine = instance.externalUserRecommendationEngine;
		const url = engine
			.replace('{{host}}', hostName)
			.replace('{{user}}', userName)
			.replace('{{limit}}', limit.toString())
			.replace('{{offset}}', offset.toString());

		request({
			url: url,
			proxy: config.proxy,
			timeout: timeout,
			json: true,
			followRedirect: true,
			followAllRedirects: true
		})
			.then(body => convertUsers(body, me))
			.then(packed => res(packed))
			.catch(e => rej(e));
	} else {
		// ID list of the user itself and other users who the user follows
		const followingIds = await getFriendIds(me._id);

	// 隠すユーザーを取得
	const hideUserIds = await getHideUserIds(me);

		const users = await User
			.find({
				_id: {
					$nin: followingIds.concat(hideUserIds)
				},
				isLocked: { $ne: true },
				updatedAt: {
					$gte: new Date(Date.now() - ms('7days'))
				},
				host: null
			}, {
				limit: ps.limit,
				skip: ps.offset,
				sort: {
					followersCount: -1
				}
			});

		res(await Promise.all(users.map(user => pack(user, me, { detail: true }))));
	}
}));

type IRecommendUser = {
	name: string;
	username: string;
	host: string;
	description: string;
	avatarUrl: string;
};

/**
 * Resolve/Pack dummy users
 */
async function convertUsers(src: IRecommendUser[], me: ILocalUser) {
	const packed = await Promise.all(src.map(async x => {
		const user = await resolveUser(x.username, x.host)
			.catch(() => {
				apiLogger.warn(`Can't resolve ${x.username}@${x.host}`);
				return null;
			});

		if (user == null) return x;

		return await pack(user, me, { detail: true });
	}));

	return packed;
}
