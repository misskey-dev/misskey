import $ from 'cafy';
import define from '../../../define';
import { Emojis } from '@/models/index';
import { toPuny } from '@/misc/convert-host';
import { makePaginationQuery } from '../../../common/make-pagination-query';
import { ID } from '@/misc/cafy-id';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		query: {
			validator: $.optional.nullable.str,
			default: null,
		},

		host: {
			validator: $.optional.nullable.str,
			default: null,
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
	},

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				id: {
					type: 'string',
					optional: false, nullable: false,
					format: 'id',
				},
				aliases: {
					type: 'array',
					optional: false, nullable: false,
					items: {
						type: 'string',
						optional: false, nullable: false,
					},
				},
				name: {
					type: 'string',
					optional: false, nullable: false,
				},
				category: {
					type: 'string',
					optional: false, nullable: true,
				},
				host: {
					type: 'string',
					optional: false, nullable: true,
				},
				url: {
					type: 'string',
					optional: false, nullable: false,
				},
			},
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
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
