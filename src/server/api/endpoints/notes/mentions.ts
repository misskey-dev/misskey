import $ from 'cafy';
import { StringID, NumericalID } from '../../../../misc/cafy-id';
import Note from '../../../../models/entities/note';
import { getFriendIds, getFriends } from '../../common/get-friends';
import { packMany } from '../../../../models/entities/note';
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
			validator: $.optional.type(NumericalID),
		},

		untilId: {
			validator: $.optional.type(NumericalID),
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
	const followings = await getFriends(user.id);

	const visibleQuery = [{
		visibility: { $in: [ 'public', 'home' ] }
	}, {
		// myself (for followers/specified/private)
		userId: user.id
	}, {
		// to me (for specified)
		visibleUserIds: { $in: [ user.id ] }
	}, {
		visibility: 'followers',
		$or: [{
			// フォロワーの投稿
			userId: { $in: followings.map(f => f.id) },
		}, {
			// 自分の投稿へのリプライ
			'_reply.userId': user.id,
		}, {
			// 自分へのメンションが含まれている
			mentions: { $in: [ user.id ] }
		}]
	}];

	const query = {
		$and: [{
			deletedAt: null,
		}, {
			$or: visibleQuery,
		}],

		$or: [{
			mentions: user.id
		}, {
			visibleUserIds: user.id
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
		id: -1
	};

	if (ps.visibility) {
		query.visibility = ps.visibility;
	}

	if (ps.following) {
		const followingIds = await getFriendIds(user.id);

		query.userId = {
			$in: followingIds
		};
	}

	if (ps.sinceId) {
		sort.id = 1;
		query.id = MoreThan(ps.sinceId);
	} else if (ps.untilId) {
		query.id = LessThan(ps.untilId);
	}

	const mentions = await Note.find(query, {
		take: ps.limit,
		sort: sort
	});

	for (const note of mentions) {
		read(user.id, note.id);
	}

	return await packMany(mentions, user);
});
