import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import Note from '../../../../../models/note';
import define from '../../../define';
import vote from '../../../../../services/note/polls/vote';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿のアンケートに投票します。',
		'en-US': 'Vote poll of a note.'
	},

	requireCredential: true,

	kind: 'vote-write',

	params: {
		noteId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象の投稿のID',
				'en-US': 'Target note ID'
			}
		},

		choice: {
			validator: $.num
		},
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	// Get votee
	const note = await Note.findOne({
		_id: ps.noteId
	});

	if (note === null) {
		return rej('note not found');
	}

	if (note.poll == null) {
		return rej('poll not found');
	}

	await vote(user, note, ps.choice).catch(e => rej(e));
}));
