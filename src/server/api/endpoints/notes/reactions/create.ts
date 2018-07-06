import $ from 'cafy'; import ID from '../../../../../cafy-id';
import Note from '../../../../../models/note';
import create from '../../../../../services/note/reaction/create';
import { validateReaction } from '../../../../../models/note-reaction';
import { ILocalUser } from '../../../../../models/user';
import getParams from '../../../get-params';

export const meta = {
	name: 'notes/reactions/create',

	desc: {
		ja: '投稿にリアクションします。'
	},

	params: {
		noteId: $.type(ID).note({
			desc: {
				ja: '対象の投稿'
			}
		}),

		reaction: $.str.pipe(validateReaction.ok).note({
			desc: {
				ja: 'リアクションの種類'
			}
		})
	}
};

/**
 * React to a note
 */
export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	// Fetch reactee
	const note = await Note.findOne({
		_id: ps.noteId
	});

	if (note === null) {
		return rej('note not found');
	}

	try {
		await create(user, note, ps.reaction);
	} catch (e) {
		rej(e);
	}

	res();
});
