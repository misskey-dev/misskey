import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { ApiError } from '../../error';
import { UserLists, UserListJoinings, Notes } from '@/models/index';
import { makePaginationQuery } from '../../common/make-pagination-query';
import { generateVisibilityQuery } from '../../common/generate-visibility-query';
import { activeUsersChart } from '@/services/chart/index';
import { Brackets } from 'typeorm';

export const meta = {
	tags: ['notes', 'lists'],

	requireCredential: true as const,

	params: {
		listId: {
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

		includeMyRenotes: {
			validator: $.optional.bool,
			default: true,
		},

		includeRenotedMyNotes: {
			validator: $.optional.bool,
			default: true,
		},

		includeLocalRenotes: {
			validator: $.optional.bool,
			default: true,
		},

		withFiles: {
			validator: $.optional.bool,
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
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
};

export default define(meta, async (ps, user) => {
	const list = await UserLists.findOne({
		id: ps.listId,
		userId: user.id,
	});

	if (list == null) {
		throw new ApiError(meta.errors.noSuchList);
	}

	//#region Construct query
	const listQuery = UserListJoinings.createQueryBuilder('joining')
		.select('joining.userId')
		.where('joining.userListId = :userListId', { userListId: list.id });

	const query = makePaginationQuery(Notes.createQueryBuilder('note'), ps.sinceId, ps.untilId)
		.andWhere(`note.userId IN (${ listQuery.getQuery() })`)
		.innerJoinAndSelect('note.user', 'user')
		.leftJoinAndSelect('note.reply', 'reply')
		.leftJoinAndSelect('note.renote', 'renote')
		.leftJoinAndSelect('reply.user', 'replyUser')
		.leftJoinAndSelect('renote.user', 'renoteUser')
		.setParameters(listQuery.getParameters());

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

	const timeline = await query.take(ps.limit!).getMany();

	activeUsersChart.update(user);

	return await Notes.packMany(timeline, user);
});
