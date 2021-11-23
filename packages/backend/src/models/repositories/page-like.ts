import { EntityRepository, Repository } from 'typeorm';
import { PageLike } from '@/models/entities/page-like';
import { Pages } from '../index';
import { User } from '@/models/entities/user';

@EntityRepository(PageLike)
export class PageLikeRepository extends Repository<PageLike> {
	public async pack(
		src: PageLike['id'] | PageLike,
		me?: { id: User['id'] } | null | undefined
	) {
		const like = typeof src === 'object' ? src : await this.findOneOrFail(src);

		return {
			id: like.id,
			page: await Pages.pack(like.page || like.pageId, me),
		};
	}

	public packMany(
		likes: any[],
		me: { id: User['id'] }
	) {
		return Promise.all(likes.map(x => this.pack(x, me)));
	}
}
