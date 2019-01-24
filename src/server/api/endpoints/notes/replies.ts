import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Note, { packMany } from '../../../../models/note';
import define from '../../define';
import Mute from '../../../../models/mute';
import { getFriends } from '../../common/get-friends';

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
			validator: $.num.optional.range(1, 100),
			default: 10
		},

		offset: {
			validator: $.num.optional.min(0),
			default: 0
		},
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	const [followings, mutedUserIds] = await Promise.all([
		// フォローを取得
		// Fetch following
		user ? getFriends(user._id) : [],

		// ミュートしているユーザーを取得
		user ? (await Mute.find({
			muterId: user._id
		})).map(m => m.muteeId) : null
	]);

	const visibleQuery = user == null ? [{
		visibility: { $in: [ 'public', 'home' ] }
	}] : [{
		visibility: { $in: [ 'public', 'home' ] }
	}, {
		// myself (for specified/private)
		userId: user._id
	}, {
		// to me (for specified)
		visibleUserIds: { $in: [ user._id ] }
	}, {
		visibility: 'followers',
		userId: { $in: followings.map(f => f.id) }
	}];

	const q = {
		replyId: ps.noteId,
		$or: visibleQuery
	} as any;

	if (mutedUserIds && mutedUserIds.length > 0) {
		q['userId'] = {
			$nin: mutedUserIds
		};
	}

	const notes = await Note.find(q, {
		limit: ps.limit,
		skip: ps.offset
	});

	res(await packMany(notes, user));
}));
