import define from '../../define.js';
import { ApiError } from '../../error.js';
import { Pages, PageLikes } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';

export const meta = {
	tags: ['pages'],

	requireCredential: true,

	kind: 'write:page-likes',

	errors: {
		noSuchPage: {
			message: 'No such page.',
			code: 'NO_SUCH_PAGE',
			id: 'cc98a8a2-0dc3-4123-b198-62c71df18ed3',
		},

		yourPage: {
			message: 'You cannot like your page.',
			code: 'YOUR_PAGE',
			id: '28800466-e6db-40f2-8fae-bf9e82aa92b8',
		},

		alreadyLiked: {
			message: 'The page has already been liked.',
			code: 'ALREADY_LIKED',
			id: 'cc98a8a2-0dc3-4123-b198-62c71df18ed3',
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

	if (page.userId === user.id) {
		throw new ApiError(meta.errors.yourPage);
	}

	// if already liked
	const exist = await PageLikes.findOneBy({
		pageId: page.id,
		userId: user.id,
	});

	if (exist != null) {
		throw new ApiError(meta.errors.alreadyLiked);
	}

	// Create like
	await PageLikes.insert({
		id: genId(),
		createdAt: new Date(),
		pageId: page.id,
		userId: user.id,
	});

	Pages.increment({ id: page.id }, 'likedCount', 1);
});
