import { db } from '@/db/postgre.js';
import { GalleryPost } from '@/models/entities/gallery-post.js';
import { Packed } from '@/misc/schema.js';
import { Users, DriveFiles, GalleryLikes } from '../index.js';
import { awaitAll } from '@/prelude/await-all.js';
import { User } from '@/models/entities/user.js';

export const GalleryPostRepository = db.getRepository(GalleryPost).extend({
	async pack(
		src: GalleryPost['id'] | GalleryPost,
		me?: { id: User['id'] } | null | undefined,
	): Promise<Packed<'GalleryPost'>> {
		const meId = me ? me.id : null;
		const post = typeof src === 'object' ? src : await this.findOneByOrFail({ id: src });

		return await awaitAll({
			id: post.id,
			createdAt: post.createdAt.toISOString(),
			updatedAt: post.updatedAt.toISOString(),
			userId: post.userId,
			user: Users.pack(post.user || post.userId, me),
			title: post.title,
			description: post.description,
			fileIds: post.fileIds,
			files: DriveFiles.packMany(post.fileIds),
			tags: post.tags.length > 0 ? post.tags : undefined,
			isSensitive: post.isSensitive,
			likedCount: post.likedCount,
			isLiked: meId ? await GalleryLikes.findOneBy({ postId: post.id, userId: meId }).then(x => x != null) : undefined,
		});
	},

	packMany(
		posts: GalleryPost[],
		me?: { id: User['id'] } | null | undefined,
	) {
		return Promise.all(posts.map(x => this.pack(x, me)));
	},
});
