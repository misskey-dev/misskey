import $ from 'cafy';
import Vote from '../../../../../models/poll-vote';
import Note, { pack } from '../../../../../models/note';
import define from '../../../define';
import { getHideUserIds } from '../../../common/get-hide-users';

export const meta = {
	desc: {
		'ja-JP': 'おすすめのアンケート一覧を取得します。',
		'en-US': 'Get recommended polls.'
	},

	tags: ['notes'],

	requireCredential: true,

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		offset: {
			validator: $.optional.num.min(0),
			default: 0
		}
	}
};

export default define(meta, async (ps, user) => {
	// Get votes
	const votes = await Vote.find({
		userId: user._id
	}, {
		fields: {
			_id: false,
			noteId: true
		}
	});

	const nin = votes && votes.length != 0 ? votes.map(v => v.noteId) : [];

	// 隠すユーザーを取得
	const hideUserIds = await getHideUserIds(user);

	const notes = await Note.find({
		'_user.host': null,
		_id: {
			$nin: nin
		},
		userId: {
			$ne: user._id,
			$nin: hideUserIds
		},
		poll: {
			$exists: true,
			$ne: null
		}
	}, {
		limit: ps.limit,
		skip: ps.offset,
		sort: {
			_id: -1
		}
	});

	return await Promise.all(notes.map(note => pack(note, user, {
		detail: true
	})));
});
