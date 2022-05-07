import define from '../../../define.js';
import { ApiError } from '../../../error.js';
import { GalleryPosts } from '@/models/index.js';

export const meta = {
	tags: ['gallery'],

	requireCredential: true,

	kind: 'write:gallery',

	errors: {
		noSuchPost: {
			message: 'No such post.',
			code: 'NO_SUCH_POST',
			id: 'ae52f367-4bd7-4ecd-afc6-5672fff427f5',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		postId: { type: 'string', format: 'misskey:id' },
	},
	required: ['postId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const post = await GalleryPosts.findOneBy({
		id: ps.postId,
		userId: user.id,
	});

	if (post == null) {
		throw new ApiError(meta.errors.noSuchPost);
	}

	await GalleryPosts.delete(post.id);
});
