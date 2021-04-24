import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../../define';
import { ApiError } from '../../../error';
import { GalleryPosts, GalleryLikes } from '../../../../../models';
import { genId } from '@/misc/gen-id';

export const meta = {
	tags: ['gallery'],

	requireCredential: true as const,

	kind: 'write:gallery-likes',

	params: {
		postId: {
			validator: $.type(ID),
		}
	},

	errors: {
		noSuchPost: {
			message: 'No such post.',
			code: 'NO_SUCH_POST',
			id: '56c06af3-1287-442f-9701-c93f7c4a62ff'
		},

		yourPost: {
			message: 'You cannot like your post.',
			code: 'YOUR_POST',
			id: 'f78f1511-5ebc-4478-a888-1198d752da68'
		},

		alreadyLiked: {
			message: 'The post has already been liked.',
			code: 'ALREADY_LIKED',
			id: '40e9ed56-a59c-473a-bf3f-f289c54fb5a7'
		},
	}
};

export default define(meta, async (ps, user) => {
	const post = await GalleryPosts.findOne(ps.postId);
	if (post == null) {
		throw new ApiError(meta.errors.noSuchPost);
	}

	if (post.userId === user.id) {
		throw new ApiError(meta.errors.yourPost);
	}

	// if already liked
	const exist = await GalleryLikes.findOne({
		postId: post.id,
		userId: user.id
	});

	if (exist != null) {
		throw new ApiError(meta.errors.alreadyLiked);
	}

	// Create like
	await GalleryLikes.insert({
		id: genId(),
		createdAt: new Date(),
		postId: post.id,
		userId: user.id
	});

	GalleryPosts.increment({ id: post.id }, 'likedCount', 1);
});
