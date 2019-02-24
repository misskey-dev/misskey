import $ from 'cafy';
import * as mongo from 'mongodb';
import Note from '../../../../models/note';
import { packMany } from '../../../../models/note';
import es from '../../../../db/elasticsearch';
import define from '../../define';
import { ApiError } from '../../error';

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
		type: 'array',
		items: {
			type: 'Note',
		},
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
			size: ps.limit,
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

	const hits = response.hits.hits.map(hit => new mongo.ObjectID(hit._id));

	// Fetch found notes
	const notes = await Note.find({
		_id: {
			$in: hits
		}
	}, {
		sort: {
			_id: -1
		}
	});

	return await packMany(notes, me);
});
