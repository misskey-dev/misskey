import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { makePaginationQuery } from '../../common/make-pagination-query';
import { Notes } from '@/models/index';
import { generateMutedUserQuery } from '../../common/generate-muted-user-query';
import { generateVisibilityQuery } from '../../common/generate-visibility-query';
import { Brackets } from 'typeorm';
import { safeForSql } from '@/misc/safe-for-sql';
import { normalizeForSearch } from '@/misc/normalize-for-search';
import { generateBlockedUserQuery } from '../../common/generate-block-query';

export const meta = {
	tags: ['notes', 'hashtags'],

	params: {
		tag: {
			validator: $.optional.str,
		},

		query: {
			validator: $.optional.arr($.arr($.str)),
		},

		reply: {
			validator: $.optional.nullable.bool,
			default: null,
		},

		renote: {
			validator: $.optional.nullable.bool,
			default: null,
		},

		withFiles: {
			validator: $.optional.bool,
		},

		poll: {
			validator: $.optional.nullable.bool,
			default: null,
		},

		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'Note',
		}
	},
};

export default define(meta, async (ps, me) => {
	const query = makePaginationQuery(Notes.createQueryBuilder('note'), ps.sinceId, ps.untilId)
		.innerJoinAndSelect('note.user', 'user')
		.leftJoinAndSelect('note.reply', 'reply')
		.leftJoinAndSelect('note.renote', 'renote')
		.leftJoinAndSelect('reply.user', 'replyUser')
		.leftJoinAndSelect('renote.user', 'renoteUser');

	generateVisibilityQuery(query, me);
	if (me) generateMutedUserQuery(query, me);
	if (me) generateBlockedUserQuery(query, me);

	try {
		if (ps.tag) {
			if (!safeForSql(ps.tag)) throw 'Injection';
			query.andWhere(`'{"${normalizeForSearch(ps.tag)}"}' <@ note.tags`);
		} else {
			query.andWhere(new Brackets(qb => {
				for (const tags of ps.query!) {
					qb.orWhere(new Brackets(qb => {
						for (const tag of tags) {
							if (!safeForSql(tag)) throw 'Injection';
							qb.andWhere(`'{"${normalizeForSearch(tag)}"}' <@ note.tags`);
						}
					}));
				}
			}));
		}
	} catch (e) {
		if (e === 'Injection') return [];
		throw e;
	}

	if (ps.reply != null) {
		if (ps.reply) {
			query.andWhere('note.replyId IS NOT NULL');
		} else {
			query.andWhere('note.replyId IS NULL');
		}
	}

	if (ps.renote != null) {
		if (ps.renote) {
			query.andWhere('note.renoteId IS NOT NULL');
		} else {
			query.andWhere('note.renoteId IS NULL');
		}
	}

	if (ps.withFiles) {
		query.andWhere('note.fileIds != \'{}\'');
	}

	if (ps.poll != null) {
		if (ps.poll) {
			query.andWhere('note.hasPoll = TRUE');
		} else {
			query.andWhere('note.hasPoll = FALSE');
		}
	}

	// Search notes
	const notes = await query.take(ps.limit!).getMany();

	return await Notes.packMany(notes, me);
});
