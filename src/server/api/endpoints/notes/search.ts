import $ from 'cafy';
import * as mongo from 'mongodb';
import Note from '../../../../models/note';
import { ILocalUser } from '../../../../models/user';
import { packMany } from '../../../../models/note';
import es from '../../../../db/elasticsearch';

export default (params: any, me: ILocalUser) => new Promise(async (res, rej) => {
	// Get 'query' parameter
	const [query, queryError] = $.str.get(params.query);
	if (queryError) return rej('invalid query param');

	// Get 'offset' parameter
	const [offset = 0, offsetErr] = $.num.optional.min(0).get(params.offset);
	if (offsetErr) return rej('invalid offset param');

	// Get 'limit' parameter
	const [limit = 10, limitErr] = $.num.optional.range(1, 30).get(params.limit);
	if (limitErr) return rej('invalid limit param');

	if (es == null) return rej('searching not available');

	es.search({
		index: 'misskey',
		type: 'note',
		body: {
			size: limit,
			from: offset,
			query: {
				simple_query_string: {
					fields: ['text'],
					query: query,
					default_operator: 'and'
				}
			},
			sort: [
				{ _doc: 'desc' }
			]
		}
	}, async (error, response) => {
		if (error) {
			console.error(error);
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
});
