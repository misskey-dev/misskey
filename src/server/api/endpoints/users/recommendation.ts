import ms = require('ms');
import $ from 'cafy';
import User, { pack, ILocalUser } from '../../../../models/user';
import { getFriendIds } from '../../common/get-friends';
import Mute from '../../../../models/mute';
import * as request from 'request-promise-native';
import config from '../../../../config';
import define from '../../define';
import fetchMeta from '../../../../misc/fetch-meta';
import resolveUser from '../../../../remote/resolve-user';
import { IMeta } from '../../../../models/meta';

export const meta = {
	desc: {
		'ja-JP': 'おすすめのユーザー一覧を取得します。'
	},

	requireCredential: true,

	kind: 'account-read',

	params: {
		limit: {
			validator: $.num.optional.range(1, 100),
			default: 10
		},

		offset: {
			validator: $.num.optional.min(0),
			default: 0
		}
	}
};

const requestExternal = (meta: IMeta, schema: { [x: string]: string }) => {
	if (!meta.enableExternalUserRecommendation) throw null;
	return request({
		url: Object.entries(schema).reduce((a, [k, v]) => a.replace(`{{${k}}}`, v), meta.externalUserRecommendationEngine),
		proxy: config.proxy,
		timeout: meta.externalUserRecommendationTimeout,
		json: true,
		followRedirect: true,
		followAllRedirects: true
	});
};

export default define(meta, (ps, me) => fetchMeta()
	.then(x => requestExternal(x, {
			host: config.hostname,
			user: me.username,
			limit: ps.limit.toString(),
			offset: ps.offset.toString()
		}))
	.then(x => convertUsers(x, me))
	.catch(() => getFriendIds(me._id)
		.then(friends => Mute.find({ muterId: me._id })
			.then(mutes => User.find({
					_id: { $nin: [...friends, ...mutes.map(x => x.muteeId)] },
					isLocked: { $ne: true },
					updatedAt: { $gte: new Date(Date.now() - ms('7days')) },
					host: null
				}, {
					limit: ps.limit,
					skip: ps.offset,
					sort: { followersCount: -1 }
				})))
		.then(x => Promise.all(x.map(x => pack(x, me, { detail: true }))))));

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
				console.warn(`Can't resolve ${x.username}@${x.host}`);
				return null;
			});

		if (user == null) return x;

		return await pack(user, me, { detail: true });
	}));

	return packed;
}
