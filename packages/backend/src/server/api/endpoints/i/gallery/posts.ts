import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { GalleryPosts } from '@/models/index.js';
import { makePaginationQuery } from '../../../common/make-pagination-query.js';

export const meta = {
	tags: ['account', 'gallery'],

	requireCredential: true,

	kind: 'read:gallery',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'GalleryPost',
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
			const query = makePaginationQuery(GalleryPosts.createQueryBuilder('post'), ps.sinceId, ps.untilId)
				.andWhere('post.userId = :meId', { meId: user.id });

			const posts = await query
				.take(ps.limit)
				.getMany();

			return await GalleryPosts.packMany(posts, user);
		});
	}
}
