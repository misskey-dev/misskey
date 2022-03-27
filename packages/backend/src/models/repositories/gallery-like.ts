import { db } from '@/db/postgre.js';
import { GalleryLike } from '@/models/entities/gallery-like.js';
import { GalleryPosts } from '../index.js';

export const GalleryLikeRepository = db.getRepository(GalleryLike).extend({
	async pack(
		src: GalleryLike['id'] | GalleryLike,
		me?: any
	) {
		const like = typeof src === 'object' ? src : await this.findOneByOrFail({ id: src });

		return {
			id: like.id,
			post: await GalleryPosts.pack(like.post || like.postId, me),
		};
	},

	packMany(
		likes: any[],
		me: any
	) {
		return Promise.all(likes.map(x => this.pack(x, me)));
	},
});
