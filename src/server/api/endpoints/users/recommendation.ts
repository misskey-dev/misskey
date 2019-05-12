import * as ms from 'ms';
import $ from 'cafy';
import define from '../../define';
import { Users, Followings } from '../../../../models';
import { generateMuteQueryForUsers } from '../../common/generate-mute-query';
import { types, bool } from '../../../../misc/schema';
import { fetchMeta } from '../../../../misc/fetch-meta';
import config from '../../../../config';
import * as request from 'request-promise-native';
import { apiLogger } from '../../logger';

export const meta = {
	desc: {
		'ja-JP': 'おすすめのユーザー一覧を取得します。'
	},

	tags: ['users'],

	requireCredential: true,

	kind: 'read:account',

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		offset: {
			validator: $.optional.num.min(0),
			default: 0
		}
	},

	res: {
		type: types.array,
		optional: bool.false, nullable: bool.false,
		items: {
			type: types.object,
			optional: bool.false, nullable: bool.false,
			ref: 'User',
		}
	},
};

export default define(meta, async (ps, me) => {
	const instance = await fetchMeta();
	const external = instance.enableExternalUserRecommendation;

	if (external) {
		const userName = me.username;
		const hostName = config.hostname;
		const limit = ps.limit || 3;
		const offset = ps.offset || 0;
		const timeout = instance.externalUserRecommendationTimeout;
		const engine = instance.externalUserRecommendationEngine || '';
		const url = engine
			.replace('{{host}}', hostName)
			.replace('{{user}}', userName)
			.replace('{{limit}}', limit.toString())
			.replace('{{offset}}', offset.toString());
		apiLogger.info(url);
		const users = await request({
			url: url,
			proxy: config.proxy,
			timeout: timeout,
			json: true,
			followRedirect: true,
			followAllRedirects: true
		});
		return users;
	} else {
		const query = Users.createQueryBuilder('user')
			.where('user.isLocked = FALSE')
			.andWhere('user.host IS NULL')
			.andWhere('user.updatedAt >= :date', { date: new Date(Date.now() - ms('7days')) })
			.andWhere('user.id != :meId', { meId: me.id })
			.orderBy('user.followersCount', 'DESC');

		generateMuteQueryForUsers(query, me);

		const followingQuery = Followings.createQueryBuilder('following')
			.select('following.followeeId')
			.where('following.followerId = :followerId', { followerId: me.id });

		query
			.andWhere(`user.id NOT IN (${ followingQuery.getQuery() })`);

		query.setParameters(followingQuery.getParameters());

		const users = await query.take(ps.limit!).skip(ps.offset).getMany();

		return await Users.packMany(users, me, { detail: true });
	}
});
