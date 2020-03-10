import $ from 'cafy';
import { ID } from '../../../../../misc/cafy-id';
import define from '../../../define';
import { makePaginationQuery } from '../../../common/make-pagination-query';
import { MutedWords } from '../../../../../models';

export const meta = {
	desc: {
		'ja-JP': 'ミュートしているワード一覧を取得します。',
		'en-US': 'Get muted-words.'
	},

	tags: ['mute'],

	requireCredential: true as const,

	kind: 'read:mutes',

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 30
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
			ref: 'MutedWord',
		}
	},
};

export default define(meta, async (ps, me) => {
	const query = makePaginationQuery(MutedWords.createQueryBuilder('mutedWords'), ps.sinceId, ps.untilId)
		.andWhere(`mutedWords.userId = :meId`, { meId: me.id });

	const mutings = await query
		.take(ps.limit!)
		.getMany();

	return await MutedWords.packMany(mutings);
});
