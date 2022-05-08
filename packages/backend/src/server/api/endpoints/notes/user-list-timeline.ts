import define from '../../define.js';
import { ApiError } from '../../error.js';
import { UserLists, UserListJoinings, Notes } from '@/models/index.js';
import { makePaginationQuery } from '../../common/make-pagination-query.js';
import { generateVisibilityQuery } from '../../common/generate-visibility-query.js';
import { activeUsersChart } from '@/services/chart/index.js';
import { Brackets } from 'typeorm';

export const meta = {
	tags: ['notes', 'lists'],

	requireCredential: true,

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
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: '8fb1fbd5-e476-4c37-9fb0-43d55b63a2ff',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		listId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		sinceDate: { type: 'integer' },
		untilDate: { type: 'integer' },
		includeMyRenotes: { type: 'boolean', default: true },
		includeRenotedMyNotes: { type: 'boolean', default: true },
		includeLocalRenotes: { type: 'boolean', default: true },
		withFiles: {
			type: 'boolean',
			default: false,
			description: 'Only show notes that have attached files.',
		},
	},
	required: ['listId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const list = await UserLists.findOneBy({
		id: ps.listId,
		userId: user.id,
	});

	if (list == null) {
		throw new ApiError(meta.errors.noSuchList);
	}

	//#region Construct query
	const query = makePaginationQuery(Notes.createQueryBuilder('note'), ps.sinceId, ps.untilId)
		.innerJoin(UserListJoinings.metadata.targetName, 'userListJoining', 'userListJoining.userId = note.userId')
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
		.leftJoinAndSelect('renoteUser.banner', 'renoteUserBanner')
		.andWhere('userListJoining.userListId = :userListId', { userListId: list.id });

	generateVisibilityQuery(query, user);

	if (ps.includeMyRenotes === false) {
		query.andWhere(new Brackets(qb => {
			qb.orWhere('note.userId != :meId', { meId: user.id });
			qb.orWhere('note.renoteId IS NULL');
			qb.orWhere('note.text IS NOT NULL');
			qb.orWhere('note.fileIds != \'{}\'');
			qb.orWhere('0 < (SELECT COUNT(*) FROM poll WHERE poll."noteId" = note.id)');
		}));
	}

	if (ps.includeRenotedMyNotes === false) {
		query.andWhere(new Brackets(qb => {
			qb.orWhere('note.renoteUserId != :meId', { meId: user.id });
			qb.orWhere('note.renoteId IS NULL');
			qb.orWhere('note.text IS NOT NULL');
			qb.orWhere('note.fileIds != \'{}\'');
			qb.orWhere('0 < (SELECT COUNT(*) FROM poll WHERE poll."noteId" = note.id)');
		}));
	}

	if (ps.includeLocalRenotes === false) {
		query.andWhere(new Brackets(qb => {
			qb.orWhere('note.renoteUserHost IS NOT NULL');
			qb.orWhere('note.renoteId IS NULL');
			qb.orWhere('note.text IS NOT NULL');
			qb.orWhere('note.fileIds != \'{}\'');
			qb.orWhere('0 < (SELECT COUNT(*) FROM poll WHERE poll."noteId" = note.id)');
		}));
	}

	if (ps.withFiles) {
		query.andWhere('note.fileIds != \'{}\'');
	}
	//#endregion

	const timeline = await query.take(ps.limit).getMany();

	activeUsersChart.read(user);

	return await Notes.packMany(timeline, user);
});
