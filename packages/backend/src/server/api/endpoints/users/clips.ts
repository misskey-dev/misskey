import { Inject, Injectable } from '@nestjs/common';
import { Clips } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { makePaginationQuery } from '../../common/make-pagination-query.js';

export const meta = {
	tags: ['users', 'clips'],

	description: 'Show all clips this user owns.',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Clip',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
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
			const query = makePaginationQuery(Clips.createQueryBuilder('clip'), ps.sinceId, ps.untilId)
				.andWhere('clip.userId = :userId', { userId: ps.userId })
				.andWhere('clip.isPublic = true');

			const clips = await query
				.take(ps.limit)
				.getMany();

			return await Clips.packMany(clips);
		});
	}
}
