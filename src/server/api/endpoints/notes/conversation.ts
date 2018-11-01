import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Note, { packMany, INote } from '../../../../models/note';
import { ILocalUser } from '../../../../models/user';
import getParams from '../../get-params';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿の文脈を取得します。',
		'en-US': 'Show conversation of a note.'
	},

	requireCredential: false,

	params: {
		noteId: {
			validator: $.type(ID),
			transform: transform,
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

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	// Lookup note
	const note = await Note.findOne({
		_id: ps.noteId
	});

	if (note === null) {
		return rej('note not found');
	}

	const conversation: INote[] = [];
	let i = 0;

	async function get(id: any) {
		i++;
		const p = await Note.findOne({ _id: id });

		if (i > ps.offset) {
			conversation.push(p);
		}

		if (conversation.length == ps.limit) {
			return;
		}

		if (p.replyId) {
			await get(p.replyId);
		}
	}

	if (note.replyId) {
		await get(note.replyId);
	}

	res(await packMany(conversation, user));
});
