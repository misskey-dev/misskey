import $ from 'cafy'; import ID from '../../../../../misc/cafy-id';
import Note from '../../../../../models/note';
import create from '../../../../../services/note/reaction/create';
import { validateReaction } from '../../../../../models/note-reaction';
import { ILocalUser } from '../../../../../models/user';
import getParams from '../../../get-params';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿にリアクションします。',
		'en-US': 'React to a note.'
	},

	requireCredential: true,

	kind: 'reaction-write',

	params: {
		noteId: $.type(ID).note({
			desc: {
				'ja-JP': '対象の投稿'
			}
		}),

		reaction: $.str.pipe(validateReaction.ok).note({
			desc: {
				'ja-JP': 'リアクションの種類'
			}
		})
	}
};

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
