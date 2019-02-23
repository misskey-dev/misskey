import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import Note from '../../../../models/note';
import { getFriendIds, getFriends } from '../../common/get-friends';
import { packMany } from '../../../../models/note';
import define from '../../define';
import read from '../../../../services/note/read';
import { getHideUserIds } from '../../common/get-hide-users';

export const meta = {
	desc: {
		'ja-JP': '自分に言及している投稿の一覧を取得します。',
		'en-US': 'Get mentions of myself.'
	},

	tags: ['notes'],

	requireCredential: true,

	params: {
		following: {
			validator: $.optional.bool,
			default: false
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		sinceId: {
			validator: $.optional.type(ID),
			transform: transform,
		},

		untilId: {
			validator: $.optional.type(ID),
			transform: transform,
		},

		visibility: {
			validator: $.optional.str,
		},
	},

	res: {
		type: 'array',
		items: {
			type: 'Note',
		},
	},
};

export default define(meta, async (ps, user) => {
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

	// 隠すユーザーを取得
	const hideUserIds = await getHideUserIds(user);

	if (hideUserIds && hideUserIds.length > 0) {
		query.userId = {
			$nin: hideUserIds
		};

		query['_reply.userId'] = {
			$nin: hideUserIds
		};

		query['_renote.userId'] = {
			$nin: hideUserIds
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

	const mentions = await Note.find(query, {
		limit: ps.limit,
		sort: sort
	});

	for (const note of mentions) {
		read(user._id, note._id);
	}

	return await packMany(mentions, user);
});
