import $ from 'cafy';
import * as mongo from 'mongodb';
import Note from '../../../../models/note';
import { packMany } from '../../../../models/note';
import es from '../../../../db/elasticsearch';
import define from '../../define';
import { apiLogger } from '../../logger';

export const meta = {
	desc: {
		'ja-JP': '投稿を検索します。',
		'en-US': 'Search notes.'
	},

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
	}
};

export default define(meta, (ps, me) => new Promise(async (res, rej) => {
	if (es == null) return rej('searching not available');

	es.search({
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
	}, async (error, response) => {
		if (error) {
			apiLogger.error(error);
			return res(500);
		}

		if (response.hits.total === 0) {
			return res([]);
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

		res(await packMany(notes, me));
	});
}));
