import { Inject, Injectable } from '@nestjs/common';
import type { Notes , NoteThreadMutings } from '@/models/index.js';
import { NoteFavorites, NoteWatchings } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			isFavorited: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			isWatching: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			isMutedThread: {
				type: 'boolean',
				optional: false, nullable: false,
			},
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
		@Inject('notesRepository')
		private notesRepository: typeof Notes,

		@Inject('noteThreadMutingsRepository')
		private noteThreadMutingsRepository: typeof NoteThreadMutings,
	) {
		super(meta, paramDef, async (ps, me) => {
			const note = await this.notesRepository.findOneByOrFail({ id: ps.noteId });

			const [favorite, watching, threadMuting] = await Promise.all([
				NoteFavorites.count({
					where: {
						userId: me.id,
						noteId: note.id,
					},
					take: 1,
				}),
				NoteWatchings.count({
					where: {
						userId: me.id,
						noteId: note.id,
					},
					take: 1,
				}),
				this.noteThreadMutingsRepository.count({
					where: {
						userId: me.id,
						threadId: note.threadId || note.id,
					},
					take: 1,
				}),
			]);

			return {
				isFavorited: favorite !== 0,
				isWatching: watching !== 0,
				isMutedThread: threadMuting !== 0,
			};
		});
	}
}
