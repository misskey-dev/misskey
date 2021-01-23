import { EntityRepository, Repository } from 'typeorm';
import { GalleryLike } from '../entities/gallery-like';
import { GalleryPosts } from '..';
import { ensure } from '../../prelude/ensure';

@EntityRepository(GalleryLike)
export class GalleryLikeRepository extends Repository<GalleryLike> {
	public async pack(
		src: GalleryLike['id'] | GalleryLike,
		me?: any
	) {
		const like = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		return {
			id: like.id,
			post: await GalleryPosts.pack(like.post || like.postId, me),
		};
	}

	public packMany(
		likes: any[],
		me: any
	) {
		return Promise.all(likes.map(x => this.pack(x, me)));
	}
}
