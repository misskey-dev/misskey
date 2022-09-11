import { Inject, Injectable } from '@nestjs/common';
import { PromoReads } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '../../error.js';
import { getNote } from '../../common/getters.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'd785b897-fcd3-4fe9-8fc3-b85c26e6c932',
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
	) {
		super(meta, paramDef, async (ps, me) => {
			const note = await getNote(ps.noteId).catch(e => {
				if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
				throw e;
			});

			const exist = await PromoReads.findOneBy({
				noteId: note.id,
				userId: me.id,
			});

			if (exist != null) {
				return;
			}

			await PromoReads.insert({
				id: genId(),
				createdAt: new Date(),
				noteId: note.id,
				userId: me.id,
			});
		});
	}
}
