import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { NoteFavorites } from '@/models/index.js';
import { makePaginationQuery } from '../../common/make-pagination-query.js';

export const meta = {
	tags: ['account', 'notes', 'favorites'],

	requireCredential: true,

	kind: 'read:favorites',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'NoteFavorite',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
	},
	required: [],
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
			const query = makePaginationQuery(NoteFavorites.createQueryBuilder('favorite'), ps.sinceId, ps.untilId)
				.andWhere('favorite.userId = :meId', { meId: user.id })
				.leftJoinAndSelect('favorite.note', 'note');

			const favorites = await query
				.take(ps.limit)
				.getMany();

			return await NoteFavorites.packMany(favorites, user);
		});
	}
}
