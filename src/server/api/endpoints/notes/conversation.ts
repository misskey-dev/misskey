import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { ApiError } from '../../error';
import { getNote } from '../../common/getters';
import { Note } from '../../../../models/entities/note';
import { Notes } from '../../../../models';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿の文脈を取得します。',
		'en-US': 'Show conversation of a note.'
	},

	tags: ['notes'],

	requireCredential: false as const,

	params: {
		noteId: {
			validator: $.type(ID),
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
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'Note',
		}
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'e1035875-9551-45ec-afa8-1ded1fcb53c8'
		}
	}
};

export default define(meta, async (ps, user) => {
	const note = await getNote(ps.noteId).catch(e => {
		if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
		throw e;
	});

	const conversation: Note[] = [];
	let i = 0;

	async function get(id: any) {
		i++;
		const p = await Notes.findOne(id);
		if (p == null) return;

		if (i > ps.offset!) {
			conversation.push(p);
		}

		if (conversation.length == ps.limit!) {
			return;
		}

		if (p.replyId) {
			await get(p.replyId);
		}
	}

	if (note.replyId) {
		await get(note.replyId);
	}

	return await Notes.packMany(conversation, user);
});
