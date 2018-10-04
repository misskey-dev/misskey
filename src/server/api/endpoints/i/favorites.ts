import $ from 'cafy'; import ID from '../../../../misc/cafy-id';
import Favorite, { packMany } from '../../../../models/favorite';
import { ILocalUser } from '../../../../models/user';

export const meta = {
	desc: {
		'ja-JP': 'お気に入りに登録した投稿一覧を取得します。',
		'en-US': 'Get favorited notes'
	},

	requireCredential: true,

	kind: 'favorites-read'
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	// Get 'limit' parameter
	const [limit = 10, limitErr] = $.num.optional.range(1, 100).get(params.limit);
	if (limitErr) return rej('invalid limit param');

	// Get 'sinceId' parameter
	const [sinceId, sinceIdErr] = $.type(ID).optional.get(params.sinceId);
	if (sinceIdErr) return rej('invalid sinceId param');

	// Get 'untilId' parameter
	const [untilId, untilIdErr] = $.type(ID).optional.get(params.untilId);
	if (untilIdErr) return rej('invalid untilId param');

	// Check if both of sinceId and untilId is specified
	if (sinceId && untilId) {
		return rej('cannot set sinceId and untilId');
	}

	const query = {
		userId: user._id
	} as any;

	const sort = {
		_id: -1
	};

	if (sinceId) {
		sort._id = 1;
		query._id = {
			$gt: sinceId
		};
	} else if (untilId) {
		query._id = {
			$lt: untilId
		};
	}

	// Get favorites
	const favorites = await Favorite
		.find(query, { limit, sort });

	// Serialize
	res(await packMany(favorites, user));
});
