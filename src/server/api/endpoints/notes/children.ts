import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { makePaginationQuery } from '../../common/make-pagination-query';
import { generateVisibilityQuery } from '../../common/generate-visibility-query';
import { generateMuteQuery } from '../../common/generate-mute-query';
import { Brackets } from 'typeorm';
import { Notes } from '../../../../models';
import { filterNotesByWords } from '../../common/filter-by-words';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿への返信/引用を取得します。',
		'en-US': 'Get replies/quotes of a note.'
	},

	tags: ['notes'],

	requireCredential: false as const,

	params: {
		noteId: {
			validator: $.type(ID),
			desc: {
				'ja-JP': '対象の投稿のID',
				'en-US': 'Target note ID'
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

export default define(meta, async (ps, user) => {
	const query = makePaginationQuery(Notes.createQueryBuilder('note'), ps.sinceId, ps.untilId)
		.andWhere(new Brackets(qb => { qb
			.where(`note.replyId = :noteId`, { noteId: ps.noteId })
			.orWhere(new Brackets(qb => { qb
				.where(`note.renoteId = :noteId`, { noteId: ps.noteId })
				.andWhere(new Brackets(qb => { qb
					.where(`note.text IS NOT NULL`)
					.orWhere(`note.fileIds != '{}'`)
					.orWhere(`note.hasPoll = TRUE`);
				}));
			}));
		}))
		.leftJoinAndSelect('note.user', 'user');

	generateVisibilityQuery(query, user);
	if (user) generateMuteQuery(query, user);

	let notes = await query.take(ps.limit!).getMany();
	if (user) notes = await filterNotesByWords(notes, user);

	return await Notes.packMany(notes, user);
});
