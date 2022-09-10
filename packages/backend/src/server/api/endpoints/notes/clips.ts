import { In } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { ClipNotes, Clips } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { getNote } from '../../common/getters.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['clips', 'notes'],

	requireCredential: false,

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

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
	},
	required: ['noteId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('usersRepository')
    private usersRepository: typeof Users,

		@Inject('notesRepository')
    private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, me) => {
			const note = await getNote(ps.noteId).catch(e => {
				if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
				throw e;
			});

			const clipNotes = await ClipNotes.findBy({
				noteId: note.id,
			});

			const clips = await Clips.findBy({
				id: In(clipNotes.map(x => x.clipId)),
				isPublic: true,
			});

			return await Promise.all(clips.map(x => Clips.pack(x)));
		});
	}
}
