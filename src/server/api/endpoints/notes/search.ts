import $ from 'cafy';
import * as mongo from 'mongodb';
import Note from '../../../../models/note';
import { packMany } from '../../../../models/note';
import es from '../../../../db/elasticsearch';
import define from '../../define';
import { errorWhen } from '../../../../prelude/promise';

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
			validator: $.num.optional.range(1, 100),
			default: 10
		},

		offset: {
			validator: $.num.optional.min(0),
			default: 0
		}
	}
};

export default define(meta, (ps, me) => errorWhen(
	!es,
	'searching not available')
	.then(() => es.search({
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
		})
	.then(x =>
		x.hits.total === 0 ? [] :
		Note.find({
			_id: { $in: x.hits.hits.map(x => new mongo.ObjectID(x._id)) }
		}, {
			sort: { _id: -1 }
		})
	.then(x => packMany(x, me)))));
