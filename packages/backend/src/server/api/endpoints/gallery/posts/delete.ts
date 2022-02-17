import define from '../../../define';
import { ApiError } from '../../../error';
import { GalleryPosts } from '@/models/index';

export const meta = {
	tags: ['gallery'],

	requireCredential: true,

	kind: 'write:gallery',

	params: {
		type: 'object',
		properties: {
			postId: { type: 'string', format: 'misskey:id', },
		},
		required: ['postId'],
	},

	errors: {
		noSuchPost: {
			message: 'No such post.',
			code: 'NO_SUCH_POST',
			id: 'ae52f367-4bd7-4ecd-afc6-5672fff427f5',
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
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
