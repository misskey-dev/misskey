import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { NoteReactions, UserProfiles } from '@/models/index';
import { makePaginationQuery } from '../../common/make-pagination-query';
import { generateVisibilityQuery } from '../../common/generate-visibility-query';
import { ApiError } from '../../error';

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
		reactionsNotPublic: {
			message: 'Reactions of the user is not public.',
			code: 'REACTIONS_NOT_PUBLIC',
			id: '673a7dd2-6924-1093-e0c0-e68456ceae5c'
		},
	}
};

export default define(meta, async (ps, me) => {
	const profile = await UserProfiles.findOneOrFail(ps.userId);

	if (me == null || (me.id !== ps.userId && !profile.publicReactions)) {
		throw new ApiError(meta.errors.reactionsNotPublic);
	}

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
