import define from '../../define.js';
import { NoteReactions, UserProfiles } from '@/models/index.js';
import { makePaginationQuery } from '../../common/make-pagination-query.js';
import { generateVisibilityQuery } from '../../common/generate-visibility-query.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['users', 'reactions'],

	requireCredential: false,

	description: 'Show all reactions this user made.',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'NoteReaction',
		},
	},

	errors: {
		reactionsNotPublic: {
			message: 'Reactions of the user is not public.',
			code: 'REACTIONS_NOT_PUBLIC',
			id: '673a7dd2-6924-1093-e0c0-e68456ceae5c',
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
		sinceDate: { type: 'integer' },
		untilDate: { type: 'integer' },
	},
	required: ['userId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const profile = await UserProfiles.findOneByOrFail({ userId: ps.userId });

	if (me == null || (me.id !== ps.userId && !profile.publicReactions)) {
		throw new ApiError(meta.errors.reactionsNotPublic);
	}

	const query = makePaginationQuery(NoteReactions.createQueryBuilder('reaction'),
			ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
		.andWhere(`reaction.userId = :userId`, { userId: ps.userId })
		.leftJoinAndSelect('reaction.note', 'note');

	generateVisibilityQuery(query, me);

	const reactions = await query
		.take(ps.limit)
		.getMany();

	return await Promise.all(reactions.map(reaction => NoteReactions.pack(reaction, me, { withNote: true })));
});
