import define from '../../define.js';
import { makePaginationQuery } from '../../common/make-pagination-query.js';
import { Notes } from '@/models/index.js';
import { generateMutedUserQuery } from '../../common/generate-muted-user-query.js';
import { generateVisibilityQuery } from '../../common/generate-visibility-query.js';
import { Brackets } from 'typeorm';
import { safeForSql } from '@/misc/safe-for-sql.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { generateBlockedUserQuery } from '../../common/generate-block-query.js';

export const meta = {
	tags: ['notes', 'hashtags'],

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

export const paramDef = {
	type: 'object',
	properties: {
		reply: { type: 'boolean', nullable: true, default: null },
		renote: { type: 'boolean', nullable: true, default: null },
		withFiles: {
			type: 'boolean',
			default: false,
			description: 'Only show notes that have attached files.',
		},
		poll: { type: 'boolean', nullable: true, default: null },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
	},
	anyOf: [
		{
			properties: {
				tag: { type: 'string', minLength: 1 },
			},
			required: ['tag'],
		},
		{
			properties: {
				query: {
					type: 'array',
					description: 'The outer arrays are chained with OR, the inner arrays are chained with AND.',
					items: {
						type: 'array',
						items: {
							type: 'string',
							minLength: 1,
						},
						minItems: 1,
					},
					minItems: 1,
				},
			},
			required: ['query'],
		},
	],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const query = makePaginationQuery(Notes.createQueryBuilder('note'), ps.sinceId, ps.untilId)
		.innerJoinAndSelect('note.user', 'user')
		.leftJoinAndSelect('user.avatar', 'avatar')
		.leftJoinAndSelect('user.banner', 'banner')
		.leftJoinAndSelect('note.reply', 'reply')
		.leftJoinAndSelect('note.renote', 'renote')
		.leftJoinAndSelect('reply.user', 'replyUser')
		.leftJoinAndSelect('replyUser.avatar', 'replyUserAvatar')
		.leftJoinAndSelect('replyUser.banner', 'replyUserBanner')
		.leftJoinAndSelect('renote.user', 'renoteUser')
		.leftJoinAndSelect('renoteUser.avatar', 'renoteUserAvatar')
		.leftJoinAndSelect('renoteUser.banner', 'renoteUserBanner');

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
