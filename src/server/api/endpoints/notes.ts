import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../define';
import { makePaginationQuery } from '../common/make-pagination-query';
import { Notes } from '../../../models';

export const meta = {
	desc: {
		'ja-JP': '投稿を取得します。'
	},

	tags: ['notes'],

	params: {
		local: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'ローカルの投稿に限定するか否か'
			}
		},

		reply: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': '返信に限定するか否か'
			}
		},

		renote: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'Renoteに限定するか否か'
			}
		},

		withFiles: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'ファイルが添付された投稿に限定するか否か'
			}
		},

		poll: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'アンケートが添付された投稿に限定するか否か'
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

export default define(meta, async (ps) => {
	const query = makePaginationQuery(Notes.createQueryBuilder('note'), ps.sinceId, ps.untilId)
		.andWhere(`note.visibility = 'public'`)
		.andWhere(`note.localOnly = FALSE`)
		.innerJoinAndSelect('note.user', 'user')
		.leftJoinAndSelect('note.reply', 'reply')
		.leftJoinAndSelect('note.renote', 'renote')
		.leftJoinAndSelect('reply.user', 'replyUser')
		.leftJoinAndSelect('renote.user', 'renoteUser');

	if (ps.local) {
		query.andWhere('note.userHost IS NULL');
	}

	if (ps.reply != undefined) {
		query.andWhere(ps.reply ? 'note.replyId IS NOT NULL' : 'note.replyId IS NULL');
	}

	if (ps.renote != undefined) {
		query.andWhere(ps.renote ? 'note.renoteId IS NOT NULL' : 'note.renoteId IS NULL');
	}

	if (ps.withFiles != undefined) {
		query.andWhere(ps.withFiles ? `note.fileIds != '{}'` : `note.fileIds = '{}'`);
	}

	if (ps.poll != undefined) {
		query.andWhere(ps.poll ? 'note.hasPoll = TRUE' : 'note.hasPoll = FALSE');
	}

	// TODO
	//if (bot != undefined) {
	//	query.isBot = bot;
	//}

	const notes = await query.take(ps.limit!).getMany();

	return await Notes.packMany(notes);
});
