import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import Note, { packMany, INote } from '../../../../models/note';
import define from '../../define';

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
			desc: {
				'ja-JP': '対象の投稿のID',
				'en-US': 'Target note ID'
			}
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		offset: {
			validator: $.optional.num.min(0),
			default: 0
		},
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
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
}));
