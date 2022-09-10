import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { Emojis } from '@/models/index.js';
import { db } from '@/db/postgre.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		ids: { type: 'array', items: {
			type: 'string', format: 'misskey:id',
		} },
		aliases: { type: 'array', items: {
			type: 'string',
		} },
	},
	required: ['ids', 'aliases'],
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
		super(meta, paramDef, async (ps, user) => {
			const emojis = await Emojis.findBy({
				id: In(ps.ids),
			});

			for (const emoji of emojis) {
				await Emojis.update(emoji.id, {
					updatedAt: new Date(),
					aliases: emoji.aliases.filter(x => !ps.aliases.includes(x)),
				});
			}

			await db.queryResultCache!.remove(['meta_emojis']);
		});
	}
}
