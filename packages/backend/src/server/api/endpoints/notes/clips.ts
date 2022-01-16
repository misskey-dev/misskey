import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { ClipNotes, Clips } from '@/models/index';
import { getNote } from '../../common/getters';
import { ApiError } from '../../error';
import { In } from 'typeorm';

export const meta = {
	tags: ['clips', 'notes'],

	requireCredential: false,

	params: {
		noteId: {
			validator: $.type(ID),
		},
	},

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Clip',
		},
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '47db1a1c-b0af-458d-8fb4-986e4efafe1e',
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
	const note = await getNote(ps.noteId).catch(e => {
		if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
		throw e;
	});

	const clipNotes = await ClipNotes.find({
		noteId: note.id,
	});

	const clips = await Clips.find({
		id: In(clipNotes.map(x => x.clipId)),
		isPublic: true,
	});

	return await Promise.all(clips.map(x => Clips.pack(x)));
});
