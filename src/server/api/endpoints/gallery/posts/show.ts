import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../../define';
import { ApiError } from '../../../error';
import { GalleryPosts } from '@/models';

export const meta = {
	tags: ['gallery'],

	requireCredential: false as const,

	params: {
		postId: {
			validator: $.type(ID),
		},
	},

	errors: {
		noSuchPost: {
			message: 'No such post.',
			code: 'NO_SUCH_POST',
			id: '1137bf14-c5b0-4604-85bb-5b5371b1cd45'
		},
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		ref: 'GalleryPost'
	}
};

export default define(meta, async (ps, me) => {
	const post = await GalleryPosts.findOne({
		id: ps.postId,
	});

	if (post == null) {
		throw new ApiError(meta.errors.noSuchPost);
	}

	return await GalleryPosts.pack(post);
});
