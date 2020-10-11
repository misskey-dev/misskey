import $ from 'cafy';
import define from '../../../define';
import { Emojis } from '../../../../../models';
import { toPuny } from '../../../../../misc/convert-host';
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
		query: {
			validator: $.optional.nullable.str,
			default: null as any
		},

		host: {
			validator: $.optional.nullable.str,
			default: null as any
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
		}
	}
};

export default define(meta, async (ps) => {
	const q = makePaginationQuery(Emojis.createQueryBuilder('emoji'), ps.sinceId, ps.untilId);

	if (ps.host == null) {
		q.andWhere(`emoji.host IS NOT NULL`);
	} else {
		q.andWhere(`emoji.host = :host`, { host: toPuny(ps.host) });
	}

	if (ps.query) {
		q.andWhere('emoji.name like :query', { query: '%' + ps.query + '%' });
	}

	const emojis = await q
		.orderBy('emoji.id', 'DESC')
		.take(ps.limit!)
		.getMany();

	return Emojis.packMany(emojis);
});
