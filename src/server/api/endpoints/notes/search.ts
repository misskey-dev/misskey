import $ from 'cafy';
import es from '../../../../db/elasticsearch';
import define from '../../define';
import { ApiError } from '../../error';
import { Notes } from '../../../../models';
import { In } from 'typeorm';
import { ID } from '../../../../misc/cafy-id';
import config from '../../../../config';

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
		},

		host: {
			validator: $.optional.nullable.str,
			default: undefined
		},

		userId: {
			validator: $.optional.nullable.type(ID),
			default: null
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
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

	const userQuery = ps.userId != null ? [{
		term: {
			userId: ps.userId
		}
	}] : [];

	const hostQuery = ps.userId == null ?
		ps.host === null ? [{
			bool: {
				must_not: {
					exists: {
						field: 'userHost'
					}
				}
			}
		}] : ps.host !== undefined ? [{
			term: {
				userHost: ps.host
			}
		}] : []
	: [];

	const result = await es.search({
		index: config.elasticsearch.index || 'misskey_note',
		body: {
			size: ps.limit!,
			from: ps.offset,
			query: {
				bool: {
					must: [{
						simple_query_string: {
							fields: ['text'],
							query: ps.query.toLowerCase(),
							default_operator: 'and'
						},
					}, ...hostQuery, ...userQuery]
				}
			},
			sort: [{
				_doc: 'desc'
			}]
		}
	});

	const hits = result.body.hits.hits.map((hit: any) => hit._id);

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
