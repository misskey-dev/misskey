const ms = require('ms');
import $ from 'cafy';
import User, { pack } from '../../../../models/user';
import { getFriendIds } from '../../common/get-friends';
import Mute from '../../../../models/mute';
import * as request from 'request';
import config from '../../../../config';
import define from '../../define';
import fetchMeta from '../../../../misc/fetch-meta';


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
		}, (error: any, response: any, body: any) => {
			if (!error && response.statusCode == 200) {
				res(body);
			} else {
				res([]);
			}
		});
	} else {
		// ID list of the user itself and other users who the user follows
		const followingIds = await getFriendIds(me._id);

		// ミュートしているユーザーを取得
		const mutedUserIds = (await Mute.find({
			muterId: me._id
		})).map(m => m.muteeId);

		const users = await User
			.find({
				_id: {
					$nin: followingIds.concat(mutedUserIds)
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
