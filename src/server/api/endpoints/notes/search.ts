import $ from 'cafy';
import searchClient from '../../../../db/searchClient';
import define from '../../define';
import { Notes } from '../../../../models';
import { In } from 'typeorm';
import { ID } from '../../../../misc/cafy-id';
import config from '../../../../config';
import { makePaginationQuery } from '../../common/make-pagination-query';
import { generateVisibilityQuery } from '../../common/generate-visibility-query';
import { generateMuteQuery } from '../../common/generate-mute-query';

export const meta = {
	desc: {
		'ja-JP': '投稿を検索します。',
		'en-US': 'Search notes.'
	},

	tags: ['notes'],

	requireCredential: false as const,

	params: {
		query: {
			validator: $.str
		},

		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		host: {
			validator: $.optional.nullable.str,
			default: undefined
		},

		userId: {
			validator: $.optional.nullable.type(ID),
			default: null
		}
	},

	res: {
		type: 'array' as const,
		optional: false as const,
		nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const,
			nullable: false as const,
			ref: 'Note'
		}
	},

	errors: {
	}
};

export default define(meta, async (ps, me) => {
	if (searchClient == null) {
		const query = makePaginationQuery(Notes.createQueryBuilder('note'), ps.sinceId, ps.untilId)
			.andWhere('note.text ILIKE :q', { q: `%${ps.query}%` })
			.leftJoinAndSelect('note.user', 'user');

		generateVisibilityQuery(query, me);
		if (me) generateMuteQuery(query, me);

		const notes = await query.take(ps.limit!).getMany();

		return await Notes.packMany(notes, me);
	} else {
		const hits = await searchClient.search(ps.query, {
      userHost: ps.host,
      userId: ps.userId
    });

    if (hits.length === 0) return [];
    
    const notes = await Notes.find({
      where: {
        id: In(hits)
      },
      order: {
        id: -1
      }
    });
    
    return await Notes.packMany(notes, me);
	}
});
