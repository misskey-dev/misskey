import $ from 'cafy';
import { StringID, NumericalID } from '../../../../misc/cafy-id';
import Note, { packMany } from '../../../../models/entities/note';
import define from '../../define';
import { getFriends } from '../../common/get-friends';
import { getHideUserIds } from '../../common/get-hide-users';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿への返信を取得します。',
		'en-US': 'Get replies of a note.'
	},

	tags: ['notes'],

	requireCredential: false,

	params: {
		noteId: {
			validator: $.type(StringID),
			desc: {
				'ja-JP': '対象の投稿のID',
				'en-US': 'Target note ID'
			}
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		offset: {
			validator: $.optional.num.min(0),
			default: 0
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
	const [followings, hideUserIds] = await Promise.all([
		// フォローを取得
		// Fetch following
		user ? getFriends(user.id) : [],

		// 隠すユーザーを取得
		getHideUserIds(user)
	]);

	const visibleQuery = user == null ? [{
		visibility: { $in: [ 'public', 'home' ] }
	}] : [{
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

	const q = {
		replyId: ps.noteId,
		$or: visibleQuery
	} as any;

	if (hideUserIds && hideUserIds.length > 0) {
		q['userId'] = {
			$nin: hideUserIds
		};
	}

	const notes = await Note.find(q, {
		take: ps.limit,
		skip: ps.offset
	});

	return await packMany(notes, user);
});
