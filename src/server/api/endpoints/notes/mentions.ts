import $ from 'cafy'; import ID from '../../../../misc/cafy-id';
import Note from '../../../../models/note';
import { getFriendIds } from '../../common/get-friends';
import { packMany } from '../../../../models/note';
import { ILocalUser } from '../../../../models/user';
import getParams from '../../get-params';
import read from '../../../../services/note/read';

export const meta = {
	desc: {
		'ja-JP': '自分に言及している投稿の一覧を取得します。',
		'en-US': 'Get mentions of myself.'
	},

	requireCredential: true,

	params: {
		following: $.bool.optional.note({
			default: false
		}),

		limit: $.num.optional.range(1, 100).note({
			default: 10
		}),

		sinceId: $.type(ID).optional.note({
		}),

		untilId: $.type(ID).optional.note({
		}),

		visibility: $.str.optional.note({
		}),
	}
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	// Check if both of sinceId and untilId is specified
	if (ps.sinceId && ps.untilId) {
		return rej('cannot set sinceId and untilId');
	}

	// Construct query
	const query = {
		deletedAt: null,

		$or: [{
			mentions: user._id
		}, {
			visibleUserIds: user._id
		}]
	} as any;

	const sort = {
		_id: -1
	};

	if (ps.visibility) {
		query.visibility = ps.visibility;
	}

	if (ps.following) {
		const followingIds = await getFriendIds(user._id);

		query.userId = {
			$in: followingIds
		};
	}

	if (ps.sinceId) {
		sort._id = 1;
		query._id = {
			$gt: ps.sinceId
		};
	} else if (ps.untilId) {
		query._id = {
			$lt: ps.untilId
		};
	}

	// Issue query
	const mentions = await Note
		.find(query, {
			limit: ps.limit,
			sort: sort
		});

	mentions.forEach(note => read(user._id, note._id));

	// Serialize
	res(await packMany(mentions, user));
});
