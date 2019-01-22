import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Note, { packMany } from '../../../../models/note';
import define from '../../define';
import Mute from '../../../../models/mute';

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
	// ミュートしているユーザーを取得
	const mutedUserIds = user ? (await Mute.find({
		muterId: user._id
	})).map(m => m.muteeId) : null;

	const q = {
		replyId: ps.noteId
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
