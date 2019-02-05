import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import Note, { pack } from '../../../../models/note';
import define from '../../define';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定した投稿を取得します。',
		'en-US': 'Get a note.'
	},

	requireCredential: false,

	params: {
		noteId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象の投稿のID',
				'en-US': 'Target note ID.'
			}
		}
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	// Get note
	const note = await Note.findOne({
		_id: ps.noteId
	});

	if (note === null) {
		return rej('note not found');
	}

	// Serialize
	res(await pack(note, user, {
		detail: true
	}));
}));
