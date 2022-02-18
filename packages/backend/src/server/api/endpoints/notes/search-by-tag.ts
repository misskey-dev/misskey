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
		type: 'object',
		properties: {
			tag: { type: 'string', },
			query: { type: 'array', items: {
				type: 'array', items: {
					type: 'string',
				},
			}, },
			reply: { type: 'boolean', nullable: true, default: null, },
			renote: { type: 'boolean', nullable: true, default: null, },
			withFiles: { type: 'boolean', },
			poll: { type: 'boolean', nullable: true, default: null, },
			sinceId: { type: 'string', format: 'misskey:id', },
			untilId: { type: 'string', format: 'misskey:id', },
			limit: { type: 'integer', maximum: 100, default: 10, },
		},
		required: [],
	},

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
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
	const notes = await query.take(ps.limit).getMany();

	return await Notes.packMany(notes, me);
});
