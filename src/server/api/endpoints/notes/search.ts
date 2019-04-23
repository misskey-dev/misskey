import $ from 'cafy';
import es from '../../../../db/elasticsearch';
import define from '../../define';
import { ApiError } from '../../error';
import { Notes } from '../../../../models';
import { In } from 'typeorm';
import { types, bool } from '../../../../misc/schema';

export const meta = {
	desc: {
		'ja-JP': '投稿を検索します。',
		'en-US': 'Search notes.'
	},

	tags: ['notes'],

	requireCredential: false,

	params: {
		query: {
			validator: $.str
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		offset: {
			validator: $.optional.num.min(0),
			default: 0
		}
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

	errors: {
		searchingNotAvailable: {
			message: 'Searching not available.',
			code: 'SEARCHING_NOT_AVAILABLE',
			id: '7ee9c119-16a1-479f-a6fd-6fab00ed946f'
		}
	}
};

export default define(meta, async (ps, me) => {
	if (es == null) throw new ApiError(meta.errors.searchingNotAvailable);

	const response = await es.search({
		index: 'misskey',
		type: 'note',
		body: {
			size: ps.limit!,
			from: ps.offset,
			query: {
				simple_query_string: {
					fields: ['text'],
					query: ps.query,
					default_operator: 'and'
				}
			},
			sort: [
				{ _doc: 'desc' }
			]
		}
	});

	if (response.hits.total === 0) {
		return [];
	}

	const hits = response.hits.hits.map((hit: any) => hit.id);

	if (hits.length === 0) return [];

	// Fetch found notes
	const notes = await Notes.find({
		where: {
			id: In(hits)
		},
		order: {
			id: -1
		}
	});

	return await Notes.packMany(notes, me);
});
