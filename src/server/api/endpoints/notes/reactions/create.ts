import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import Note from '../../../../../models/note';
import create from '../../../../../services/note/reaction/create';
import { validateReaction } from '../../../../../models/note-reaction';
import define from '../../../define';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定した投稿にリアクションします。',
		'en-US': 'React to a note.'
	},

	requireCredential: true,

	kind: 'reaction-write',

	params: {
		noteId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象の投稿'
			}
		},

		reaction: {
			validator: $.str.pipe(validateReaction.ok),
			desc: {
				'ja-JP': 'リアクションの種類'
			}
		}
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	// Fetch reactee
	const note = await Note.findOne({
		_id: ps.noteId
	});

	if (note === null) {
		return rej('note not found');
	}

	if (note.deletedAt != null) {
		return rej('this not is already deleted');
	}

	try {
		await create(user, note, ps.reaction);
	} catch (e) {
		rej(e);
	}

	res();
}));
