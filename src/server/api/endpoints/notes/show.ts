import $ from 'cafy'; import ID from '../../../../misc/cafy-id';
import Note, { pack } from '../../../../models/note';
import { ILocalUser } from '../../../../models/user';
import getParams from '../../get-params';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定した投稿を取得します。',
		'en-US': 'Get a note.'
	},

	requireCredential: false,

	params: {
		noteId: $.type(ID).note({
			desc: {
				'ja-JP': '対象の投稿のID',
				'en-US': 'Target note ID.'
			}
		})
	}
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

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
});
