import $ from 'cafy';
import define from '../../../define';
import { ApiError } from '../../../error';
import { GalleryPosts } from '../../../../../models';
import { ID } from '@/misc/cafy-id';

export const meta = {
	tags: ['gallery'],

	requireCredential: true as const,

	kind: 'write:gallery',

	params: {
		postId: {
			validator: $.type(ID),
		},
	},

	errors: {
		noSuchPost: {
			message: 'No such post.',
			code: 'NO_SUCH_POST',
			id: 'ae52f367-4bd7-4ecd-afc6-5672fff427f5'
		},
	}
};

export default define(meta, async (ps, user) => {
	const post = await GalleryPosts.findOne({
		id: ps.postId,
		userId: user.id,
	});

	if (post == null) {
		throw new ApiError(meta.errors.noSuchPost);
	}

	await GalleryPosts.delete(post.id);
});
