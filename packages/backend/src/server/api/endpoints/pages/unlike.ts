import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { ApiError } from '../../error';
import { Pages, PageLikes } from '@/models/index';

export const meta = {
	tags: ['pages'],

	requireCredential: true as const,

	kind: 'write:page-likes',

	params: {
		pageId: {
			validator: $.type(ID),
		}
	},

	errors: {
		noSuchPage: {
			message: 'No such page.',
			code: 'NO_SUCH_PAGE',
			id: 'a0d41e20-1993-40bd-890e-f6e560ae648e'
		},

		notLiked: {
			message: 'You have not liked that page.',
			code: 'NOT_LIKED',
			id: 'f5e586b0-ce93-4050-b0e3-7f31af5259ee'
		},
	}
};

export default define(meta, async (ps, user) => {
	const page = await Pages.findOne(ps.pageId);
	if (page == null) {
		throw new ApiError(meta.errors.noSuchPage);
	}

	const exist = await PageLikes.findOne({
		pageId: page.id,
		userId: user.id
	});

	if (exist == null) {
		throw new ApiError(meta.errors.notLiked);
	}

	// Delete like
	await PageLikes.delete(exist.id);

	Pages.decrement({ id: page.id }, 'likedCount', 1);
});
