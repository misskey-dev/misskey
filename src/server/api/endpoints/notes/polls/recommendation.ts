import $ from 'cafy';
import Vote from '../../../../../models/entities/poll-vote';
import Note, { pack } from '../../../../../models/entities/note';
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
		userId: user.id
	}, {
		fields: {
			id: false,
			noteId: true
		}
	});

	const nin = votes && votes.length != 0 ? votes.map(v => v.noteId) : [];

	// 隠すユーザーを取得
	const hideUserIds = await getHideUserIds(user);

	const notes = await Note.find({
		'_user.host': null,
		id: {
			$nin: nin
		},
		userId: {
			$ne: user.id,
			$nin: hideUserIds
		},
		visibility: 'public',
		poll: {
			$exists: true,
			$ne: null
		},
		$or: [{
			'poll.expiresAt': null
		}, {
			'poll.expiresAt': {
				$gt: new Date()
			}
		}],
	}, {
		take: ps.limit,
		skip: ps.offset,
		sort: {
			id: -1
		}
	});

	return await Promise.all(notes.map(note => pack(note, user, {
		detail: true
	})));
});
