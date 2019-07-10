import $ from 'cafy';
import searchClient from '../../../../db/searchClient';
import define from '../../define';
import { ApiError } from '../../error';
import { Notes } from '../../../../models';
import { In } from 'typeorm';
import { types, bool } from '../../../../misc/schema';
import { ID } from '../../../../misc/cafy-id';

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
	if (searchClient == null) throw new ApiError(meta.errors.searchingNotAvailable);

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

	const hits = await searchClient.query(ps.query, {userHost: ps.host, userId: ps.userId});

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
