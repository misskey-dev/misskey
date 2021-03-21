import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { makePaginationQuery } from '../../common/make-pagination-query';
import { Notes, Followings } from '../../../../models';
import { generateVisibilityQuery } from '../../common/generate-visibility-query';
import { generateMutedUserQuery } from '../../common/generate-muted-user-query';
import { activeUsersChart } from '../../../../services/chart';
import { Brackets } from 'typeorm';
import { generateRepliesQuery } from '../../common/generate-replies-query';
import { generateMutedNoteQuery } from '../../common/generate-muted-note-query';
import { generateChannelQuery } from '../../common/generate-channel-query';

export const meta = {
	desc: {
		'ja-JP': 'タイムラインを取得します。',
		'en-US': 'Get timeline of myself.'
	},

	tags: ['notes'],

	requireCredential: true as const,

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10,
			desc: {
				'ja-JP': '最大数'
			}
		},

		sinceId: {
			validator: $.optional.type(ID),
			desc: {
				'ja-JP': '指定すると、その投稿を基点としてより新しい投稿を取得します'
			}
		},

		untilId: {
			validator: $.optional.type(ID),
			desc: {
				'ja-JP': '指定すると、その投稿を基点としてより古い投稿を取得します'
			}
		},

		sinceDate: {
			validator: $.optional.num,
			desc: {
				'ja-JP': '指定した時間を基点としてより新しい投稿を取得します。数値は、1970年1月1日 00:00:00 UTC から指定した日時までの経過時間をミリ秒単位で表します。'
			}
		},

		untilDate: {
			validator: $.optional.num,
			desc: {
				'ja-JP': '指定した時間を基点としてより古い投稿を取得します。数値は、1970年1月1日 00:00:00 UTC から指定した日時までの経過時間をミリ秒単位で表します。'
			}
		},

		includeMyRenotes: {
			validator: $.optional.bool,
			default: true,
			desc: {
				'ja-JP': '自分の行ったRenoteを含めるかどうか'
			}
		},

		includeRenotedMyNotes: {
			validator: $.optional.bool,
			default: true,
			desc: {
				'ja-JP': 'Renoteされた自分の投稿を含めるかどうか'
			}
		},

		includeLocalRenotes: {
			validator: $.optional.bool,
			default: true,
			desc: {
				'ja-JP': 'Renoteされたローカルの投稿を含めるかどうか'
			}
		},

		withFiles: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'true にすると、ファイルが添付された投稿だけ取得します'
			}
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

export default define(meta, async (ps, user) => {
	const hasFollowing = (await Followings.count({
		where: {
			followerId: user.id,
		},
		take: 1
	})) !== 0;

	//#region Construct query
	const followingQuery = Followings.createQueryBuilder('following')
		.select('following.followeeId')
		.where('following.followerId = :followerId', { followerId: user.id });

	const query = makePaginationQuery(Notes.createQueryBuilder('note'),
			ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
		.andWhere(new Brackets(qb => { qb
			.where('note.userId = :meId', { meId: user.id });
			if (hasFollowing) qb.orWhere(`note.userId IN (${ followingQuery.getQuery() })`);
		}))
		.innerJoinAndSelect('note.user', 'user')
		.leftJoinAndSelect('note.reply', 'reply')
		.leftJoinAndSelect('note.renote', 'renote')
		.leftJoinAndSelect('reply.user', 'replyUser')
		.leftJoinAndSelect('renote.user', 'renoteUser')
		.setParameters(followingQuery.getParameters());

	generateChannelQuery(query, user);
	generateRepliesQuery(query, user);
	generateVisibilityQuery(query, user);
	generateMutedUserQuery(query, user);
	generateMutedNoteQuery(query, user);

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

	process.nextTick(() => {
		if (user) {
			activeUsersChart.update(user);
		}
	});

	return await Notes.packMany(timeline, user);
});
