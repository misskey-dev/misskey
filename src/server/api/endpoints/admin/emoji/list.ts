import $ from 'cafy';
import define from '../../../define';
import { Emojis } from '../../../../../models';
import { makePaginationQuery } from '../../../common/make-pagination-query';
import { ID } from '../../../../../misc/cafy-id';

export const meta = {
	desc: {
		'ja-JP': 'カスタム絵文字を取得します。'
	},

	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		}
	}
};

export default define(meta, async (ps) => {
	const emojis = await makePaginationQuery(Emojis.createQueryBuilder('emoji'), ps.sinceId, ps.untilId)
		.andWhere(`emoji.host IS NULL`)
		.take(ps.limit!)
		.getMany();

	return emojis.map(e => ({
		id: e.id,
		name: e.name,
		category: e.category,
		aliases: e.aliases,
		host: e.host,
		url: e.url
	}));
});
