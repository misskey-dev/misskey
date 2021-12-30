import $ from 'cafy';
import define from '../../../define';
import { Emojis } from '@/models/index';
import { makePaginationQuery } from '../../../common/make-pagination-query';
import { ID } from '@/misc/cafy-id';
import { Emoji } from '@/models/entities/emoji';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		query: {
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
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: {
				id: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
					format: 'id',
				},
				aliases: {
					type: 'array' as const,
					optional: false as const, nullable: false as const,
					items: {
						type: 'string' as const,
						optional: false as const, nullable: false as const,
					},
				},
				name: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
				},
				category: {
					type: 'string' as const,
					optional: false as const, nullable: true as const,
				},
				host: {
					type: 'string' as const,
					optional: false as const, nullable: true as const,
				},
				url: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
				},
			},
		},
	},
};

export default define(meta, async (ps) => {
	const q = makePaginationQuery(Emojis.createQueryBuilder('emoji'), ps.sinceId, ps.untilId)
		.andWhere(`emoji.host IS NULL`);

	let emojis: Emoji[];

	if (ps.query) {
		//q.andWhere('emoji.name ILIKE :q', { q: `%${ps.query}%` });
		//const emojis = await q.take(ps.limit!).getMany();

		emojis = await q.getMany();

		emojis = emojis.filter(emoji =>
			emoji.name.includes(ps.query!) ||
			emoji.aliases.some(a => a.includes(ps.query!)) ||
			emoji.category?.includes(ps.query!));

		emojis.splice(ps.limit! + 1);
	} else {
		emojis = await q.take(ps.limit!).getMany();
	}

	return Emojis.packMany(emojis);
});
