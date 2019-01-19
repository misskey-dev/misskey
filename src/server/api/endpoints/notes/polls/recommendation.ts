import $ from 'cafy';
import Vote from '../../../../../models/poll-vote';
import Note, { pack } from '../../../../../models/note';
import define from '../../../define';

export const meta = {
	desc: {
		'ja-JP': 'おすすめのアンケート一覧を取得します。',
		'en-US': 'Get recommended polls.'
	},

	requireCredential: true,

	params: {
		limit: {
			validator: $.num.optional.range(1, 100),
			default: 10
		},

		offset: {
			validator: $.num.optional.min(0),
			default: 0
		}
	}
};

export default define(meta, (ps, user) => Vote.find({　userId: user._id　}, {
		fields: {
			_id: false,
			noteId: true
		}
	})
	.then(x => Note.find({
			'_user.host': null,
			_id: { $nin: x && x.length ? x.map(x => x.noteId) : [] },
			userId: { $ne: user._id },
			poll: {
				$exists: true,
				$ne: null
			}
		}, {
			limit: ps.limit,
			skip: ps.offset,
			sort: { _id: -1 }
		}))
	.then(x => Promise.all(x.map(x => pack(x, user, { detail: true })))));
