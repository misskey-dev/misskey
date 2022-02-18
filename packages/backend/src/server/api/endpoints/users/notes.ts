import define from '../../define';
import { ApiError } from '../../error';
import { getUser } from '../../common/getters';
import { makePaginationQuery } from '../../common/make-pagination-query';
import { generateVisibilityQuery } from '../../common/generate-visibility-query';
import { Notes } from '@/models/index';
import { generateMutedUserQuery } from '../../common/generate-muted-user-query';
import { Brackets } from 'typeorm';
import { generateBlockedUserQuery } from '../../common/generate-block-query';
import { generateMutedInstanceQuery } from '../../common/generate-muted-instance-query';

export const meta = {
	tags: ['users', 'notes'],

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '27e494ba-2ac2-48e8-893b-10d4d8c2387b',
		},
	},
} as const;

const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		includeReplies: { type: 'boolean', default: true },
		limit: { type: 'integer', maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		sinceDate: { type: 'integer' },
		untilDate: { type: 'integer' },
		includeMyRenotes: { type: 'boolean', default: true },
		withFiles: { type: 'boolean', default: false },
		fileType: { type: 'array', items: {
			type: 'string',
		} },
		excludeNsfw: { type: 'boolean', default: false },
	},
	required: ['userId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	// Lookup user
	const user = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
		throw e;
	});

	//#region Construct query
	const query = makePaginationQuery(Notes.createQueryBuilder('note'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
		.andWhere('note.userId = :userId', { userId: user.id })
		.innerJoinAndSelect('note.user', 'user')
		.leftJoinAndSelect('note.reply', 'reply')
		.leftJoinAndSelect('note.renote', 'renote')
		.leftJoinAndSelect('reply.user', 'replyUser')
		.leftJoinAndSelect('renote.user', 'renoteUser');

	generateVisibilityQuery(query, me);
	if (me) generateMutedUserQuery(query, me, user);
	if (me) generateBlockedUserQuery(query, me);
	if (me) generateMutedInstanceQuery(query, me);

	if (ps.withFiles) {
		query.andWhere('note.fileIds != \'{}\'');
	}

	if (ps.fileType != null) {
		query.andWhere('note.fileIds != \'{}\'');
		query.andWhere(new Brackets(qb => {
			for (const type of ps.fileType!) {
				const i = ps.fileType!.indexOf(type);
				qb.orWhere(`:type${i} = ANY(note.attachedFileTypes)`, { [`type${i}`]: type });
			}
		}));

		if (ps.excludeNsfw) {
			query.andWhere('note.cw IS NULL');
			query.andWhere('0 = (SELECT COUNT(*) FROM drive_file df WHERE df.id = ANY(note."fileIds") AND df."isSensitive" = TRUE)');
		}
	}

	if (!ps.includeReplies) {
		query.andWhere('note.replyId IS NULL');
	}

	if (ps.includeMyRenotes === false) {
		query.andWhere(new Brackets(qb => {
			qb.orWhere('note.userId != :userId', { userId: user.id });
			qb.orWhere('note.renoteId IS NULL');
			qb.orWhere('note.text IS NOT NULL');
			qb.orWhere('note.fileIds != \'{}\'');
			qb.orWhere('0 < (SELECT COUNT(*) FROM poll WHERE poll."noteId" = note.id)');
		}));
	}

	//#endregion

	const timeline = await query.take(ps.limit).getMany();

	return await Notes.packMany(timeline, me);
});
