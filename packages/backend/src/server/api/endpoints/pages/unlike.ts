import define from '../../define.js';
import { ApiError } from '../../error.js';
import { Pages, PageLikes } from '@/models/index.js';

export const meta = {
	tags: ['pages'],

	requireCredential: true,

	kind: 'write:page-likes',

	errors: {
		noSuchPage: {
			message: 'No such page.',
			code: 'NO_SUCH_PAGE',
			id: 'a0d41e20-1993-40bd-890e-f6e560ae648e',
		},

		notLiked: {
			message: 'You have not liked that page.',
			code: 'NOT_LIKED',
			id: 'f5e586b0-ce93-4050-b0e3-7f31af5259ee',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		pageId: { type: 'string', format: 'misskey:id' },
	},
	required: ['pageId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const page = await Pages.findOneBy({ id: ps.pageId });
	if (page == null) {
		throw new ApiError(meta.errors.noSuchPage);
	}

	const exist = await PageLikes.findOneBy({
		pageId: page.id,
		userId: user.id,
	});

	if (exist == null) {
		throw new ApiError(meta.errors.notLiked);
	}

	// Delete like
	await PageLikes.delete(exist.id);

	Pages.decrement({ id: page.id }, 'likedCount', 1);
});
