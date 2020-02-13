import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { fetchMeta } from '../../../../misc/fetch-meta';
import { ApiError } from '../../error';
import { makePaginationQuery } from '../../common/make-pagination-query';
import { Notes } from '../../../../models';
import { generateMuteQuery } from '../../common/generate-mute-query';
import { activeUsersChart } from '../../../../services/chart';
import { Brackets } from 'typeorm';

export const meta = {
	desc: {
		'ja-JP': 'グローバルタイムラインを取得します。'
	},

	tags: ['notes'],

	params: {
		withFiles: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'ファイルが添付された投稿に限定するか否か'
			}
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		},

		sinceDate: {
			validator: $.optional.num
		},

		untilDate: {
			validator: $.optional.num
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

	errors: {
		gtlDisabled: {
			message: 'Global timeline has been disabled.',
			code: 'GTL_DISABLED',
			id: '0332fc13-6ab2-4427-ae80-a9fadffd1a6b'
		},
	}
};

export default define(meta, async (ps, user) => {
	const m = await fetchMeta();
	if (m.disableGlobalTimeline) {
		if (user == null || (!user.isAdmin && !user.isModerator)) {
			throw new ApiError(meta.errors.gtlDisabled);
		}
	}

	//#region Construct query
	const query = makePaginationQuery(Notes.createQueryBuilder('note'),
			ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
		.andWhere('note.visibility = \'public\'')
		.andWhere('note.replyId IS NULL')
		.andWhere(new Brackets(qb => { qb
			.where(`note.replyId IS NULL`) // 返信ではない
			.orWhere('note.replyUserId = :meId', { meId: user.id }) // 返信だけど自分のノートへの返信
			.orWhere(new Brackets(qb => { qb // 返信だけど自分の行った返信
				.where(`note.replyId IS NOT NULL`)
				.andWhere('note.userId = :meId', { meId: user.id });
			}))
			.orWhere(new Brackets(qb => { qb // 返信だけど投稿者自身への返信
				.where(`note.replyId IS NOT NULL`)
				.andWhere('note.replyUserId = note.userId', { meId: user.id });
			}));
		}))
		.leftJoinAndSelect('note.user', 'user');

	if (user) generateMuteQuery(query, user);

	if (ps.withFiles) {
		query.andWhere('note.fileIds != \'{}\'');
	}
	//#endregion

	const timeline = await query.take(ps.limit!).getMany();

	process.nextTick(() => {
		if (user) {
			activeUsersChart.update(user);
		}
	});

	return await Notes.packMany(timeline, user);
});
