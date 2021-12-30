import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../../define';
import { ApiError } from '../../../error';
import { GalleryPosts, GalleryLikes } from '@/models/index';

export const meta = {
	tags: ['gallery'],

	requireCredential: true as const,

	kind: 'write:gallery-likes',

	params: {
		postId: {
			validator: $.type(ID),
		},
	},

	errors: {
		noSuchPost: {
			message: 'No such post.',
			code: 'NO_SUCH_POST',
			id: 'c32e6dd0-b555-4413-925e-b3757d19ed84',
		},

		notLiked: {
			message: 'You have not liked that post.',
			code: 'NOT_LIKED',
			id: 'e3e8e06e-be37-41f7-a5b4-87a8250288f0',
		},
	},
};

export default define(meta, async (ps, user) => {
	const post = await GalleryPosts.findOne(ps.postId);
	if (post == null) {
		throw new ApiError(meta.errors.noSuchPost);
	}

	const exist = await GalleryLikes.findOne({
		postId: post.id,
		userId: user.id,
	});

	if (exist == null) {
		throw new ApiError(meta.errors.notLiked);
	}

	// Delete like
	await GalleryLikes.delete(exist.id);

	GalleryPosts.decrement({ id: post.id }, 'likedCount', 1);
});
