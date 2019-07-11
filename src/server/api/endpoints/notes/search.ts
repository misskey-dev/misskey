import $ from 'cafy';
import searchClient from '../../../../db/searchClient';
import define from '../../define';
import {ApiError} from '../../error';
import {Notes} from '../../../../models';
import {In} from 'typeorm';
import {ID} from '../../../../misc/cafy-id';

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
		searchingNotAvailable: {
			message: 'Searching not available.',
			code: 'SEARCHING_NOT_AVAILABLE',
			id: '7ee9c119-16a1-479f-a6fd-6fab00ed946f'
		}
	}
};

export default define(meta, async (ps, me) => {
	if (searchClient == null)
		throw new ApiError(meta.errors.searchingNotAvailable);

	const hits = await searchClient.search(ps.query, {
		userHost: ps.host,
		userId: ps.userId
	});

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
