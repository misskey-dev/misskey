import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { Notes } from '../../../../models';
import { makePaginationQuery } from '../../common/make-pagination-query';
import { generateVisibilityQuery } from '../../common/generate-visibility-query';
import { generateMutedUserQuery } from '../../common/generate-muted-user-query';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿への返信を取得します。',
		'en-US': 'Get replies of a note.'
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
			validator: $.optional.num.range(1, 100),
			default: 10
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
		.andWhere('note.replyId = :replyId', { replyId: ps.noteId })
		.innerJoinAndSelect('note.user', 'user')
		.leftJoinAndSelect('note.reply', 'reply')
		.leftJoinAndSelect('note.renote', 'renote')
		.leftJoinAndSelect('reply.user', 'replyUser')
		.leftJoinAndSelect('renote.user', 'renoteUser');

	generateVisibilityQuery(query, user);
	if (user) generateMutedUserQuery(query, user);

	const timeline = await query.take(ps.limit!).getMany();

	return await Notes.packMany(timeline, user);
});
