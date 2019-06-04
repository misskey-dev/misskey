import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { makePaginationQuery } from '../../common/make-pagination-query';
import { Notes } from '../../../../models';
import { generateMuteQuery } from '../../common/generate-mute-query';
import { generateVisibilityQuery } from '../../common/generate-visibility-query';
import { Brackets } from 'typeorm';
import { types, bool } from '../../../../misc/schema';

export const meta = {
	desc: {
		'ja-JP': '指定されたタグが付けられた投稿を取得します。'
	},

	tags: ['notes', 'hashtags'],

	params: {
		tag: {
			validator: $.optional.str,
			desc: {
				'ja-JP': 'タグ'
			}
		},

		query: {
			validator: $.optional.arr($.arr($.str)),
			desc: {
				'ja-JP': 'クエリ'
			}
		},

		reply: {
			validator: $.optional.nullable.bool,
			default: null as unknown,
			desc: {
				'ja-JP': '返信に限定するか否か'
			}
		},

		renote: {
			validator: $.optional.nullable.bool,
			default: null as unknown,
			desc: {
				'ja-JP': 'Renoteに限定するか否か'
			}
		},

		withFiles: {
			validator: $.optional.bool,
			desc: {
				'ja-JP': 'true にすると、ファイルが添付された投稿だけ取得します'
			}
		},

		poll: {
			validator: $.optional.nullable.bool,
			default: null as unknown,
			desc: {
				'ja-JP': 'アンケートが添付された投稿に限定するか否か'
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

		limit: {
			validator: $.optional.num.range(1, 30),
			default: 10
		},
	},

	res: {
		type: types.array,
		optional: bool.false, nullable: bool.false,
		items: {
			type: types.object,
			optional: bool.false, nullable: bool.false,
			ref: 'Note',
		}
	},
};

export default define(meta, async (ps, me) => {
	const query = makePaginationQuery(Notes.createQueryBuilder('note'), ps.sinceId, ps.untilId)
		.leftJoinAndSelect('note.user', 'user');

	if (me) generateVisibilityQuery(query, me);
	if (me) generateMuteQuery(query, me);

	if (ps.tag) {
		query.andWhere(':tag = ANY(note.tags)', { tag: ps.tag.toLowerCase() });
	} else {
		let i = 0;
		query.andWhere(new Brackets(qb => {
			for (const tags of ps.query!) {
				qb.orWhere(new Brackets(qb => {
					for (const tag of tags) {
						qb.andWhere(`:tag${i} = ANY(note.tags)`, { [`tag${i}`]: tag.toLowerCase() });
						i++;
					}
				}));
			}
		}));
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
