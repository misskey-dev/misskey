import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Note from '../../../../models/note';
import { getFriendIds, getFriends } from '../../common/get-friends';
import { packMany } from '../../../../models/note';
import define from '../../define';
import read from '../../../../services/note/read';
import Mute from '../../../../models/mute';

export const meta = {
	desc: {
		'ja-JP': '自分に言及している投稿の一覧を取得します。',
		'en-US': 'Get mentions of myself.'
	},

	requireCredential: true,

	params: {
		following: {
			validator: $.bool.optional,
			default: false
		},

		limit: {
			validator: $.num.optional.range(1, 100),
			default: 10
		},

		sinceId: {
			validator: $.type(ID).optional,
			transform: transform,
		},

		untilId: {
			validator: $.type(ID).optional,
			transform: transform,
		},

		visibility: {
			validator: $.str.optional,
		},
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	// Check if both of sinceId and untilId is specified
	if (ps.sinceId && ps.untilId) {
		return rej('cannot set sinceId and untilId');
	}

	// フォローを取得
	const followings = await getFriends(user._id);

	const visibleQuery = [{
		visibility: { $in: [ 'public', 'home' ] }
	}, {
		// myself (for followers/specified/private)
		userId: user._id
	}, {
		// to me (for specified)
		visibleUserIds: { $in: [ user._id ] }
	}, {
		visibility: 'followers',
		$or: [{
			// フォロワーの投稿
			userId: { $in: followings.map(f => f.id) },
		}, {
			// 自分の投稿へのリプライ
			'_reply.userId': user._id,
		}, {
			// 自分へのメンションが含まれている
			mentions: { $in: [ user._id ] }
		}]
	}];

	const query = {
		$and: [{
			deletedAt: null,
		}, {
			$or: visibleQuery,
		}],

		$or: [{
			mentions: user._id
		}, {
			visibleUserIds: user._id
		}]
	} as any;

	// ミュートしているユーザーを取得
	const mutedUserIds = (await Mute.find({
		muterId: user._id
	})).map(m => m.muteeId);

	if (mutedUserIds && mutedUserIds.length > 0) {
		query.userId = {
			$nin: mutedUserIds
		};

		query['_reply.userId'] = {
			$nin: mutedUserIds
		};

		query['_renote.userId'] = {
			$nin: mutedUserIds
		};
	}

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

	const mentions = await Note
		.find(query, {
			limit: ps.limit,
			sort: sort
		});

	res(await packMany(mentions, user));

	for (const note of mentions) {
		read(user._id, note._id);
	}
}));
