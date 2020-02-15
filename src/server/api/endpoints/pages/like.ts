import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { ApiError } from '../../error';
import { Pages, PageLikes } from '../../../../models';
import { genId } from '../../../../misc/gen-id';

export const meta = {
	desc: {
		'ja-JP': '指定したページを「いいね」します。',
	},

	tags: ['pages'],

	requireCredential: true as const,

	kind: 'write:page-likes',

	params: {
		pageId: {
			validator: $.type(ID),
			desc: {
				'ja-JP': '対象のページのID',
				'en-US': 'Target page ID.'
			}
		}
	},

	errors: {
		noSuchPage: {
			message: 'No such page.',
			code: 'NO_SUCH_PAGE',
			id: 'cc98a8a2-0dc3-4123-b198-62c71df18ed3'
		},

		yourPage: {
			message: 'You cannot like your page.',
			code: 'YOUR_PAGE',
			id: '28800466-e6db-40f2-8fae-bf9e82aa92b8'
		},

		alreadyLiked: {
			message: 'The page has already been liked.',
			code: 'ALREADY_LIKED',
			id: 'cc98a8a2-0dc3-4123-b198-62c71df18ed3'
		},
	}
};

export default define(meta, async (ps, user) => {
	const page = await Pages.findOne(ps.pageId);
	if (page == null) {
		throw new ApiError(meta.errors.noSuchPage);
	}

	if (page.userId === user.id) {
		throw new ApiError(meta.errors.yourPage);
	}

	// if already liked
	const exist = await PageLikes.findOne({
		pageId: page.id,
		userId: user.id
	});

	if (exist != null) {
		throw new ApiError(meta.errors.alreadyLiked);
	}

	// Create like
	await PageLikes.save({
		id: genId(),
		createdAt: new Date(),
		pageId: page.id,
		userId: user.id
	});

	Pages.increment({ id: page.id }, 'likedCount', 1);
});
