import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import Note, { packMany } from '../../../../models/note';
import define from '../../define';
import { getFriends } from '../../common/get-friends';
import { getHideUserIds } from '../../common/get-hide-users';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿への返信を取得します。',
		'en-US': 'Get replies of a note.'
	},

	requireCredential: false,

	params: {
		noteId: {
			validator: $.type(ID),
			transform: transform,
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
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	const [followings, hideUserIds] = await Promise.all([
		// フォローを取得
		// Fetch following
		user ? getFriends(user._id) : [],

		// 隠すユーザーを取得
		getHideUserIds(user)
	]);

	const visibleQuery = user == null ? [{
		visibility: { $in: [ 'public', 'home' ] }
	}] : [{
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
		limit: ps.limit,
		skip: ps.offset
	});

	res(await packMany(notes, user));
}));
