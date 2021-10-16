import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { NoteReactions } from '@/models/index';
import { makePaginationQuery } from '../../common/make-pagination-query';
import { generateVisibilityQuery } from '../../common/generate-visibility-query';

export const meta = {
	tags: ['users', 'reactions'],

	requireCredential: false as const,

	params: {
		userId: {
			validator: $.type(ID),
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10,
		},

		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		},

		sinceDate: {
			validator: $.optional.num,
		},

		untilDate: {
			validator: $.optional.num,
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'NoteReaction',
		}
	},

	errors: {
	}
};

export default define(meta, async (ps, me) => {
	const query = makePaginationQuery(NoteReactions.createQueryBuilder('reaction'),
			ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
		.andWhere(`reaction.userId = :userId`, { userId: ps.userId })
		.leftJoinAndSelect('reaction.note', 'note');

	generateVisibilityQuery(query, me);

	const reactions = await query
		.take(ps.limit!)
		.getMany();

	return await Promise.all(reactions.map(reaction => NoteReactions.pack(reaction, me, { withNote: true })));
});
