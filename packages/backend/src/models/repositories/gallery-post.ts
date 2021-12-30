import { EntityRepository, Repository } from 'typeorm';
import { GalleryPost } from '@/models/entities/gallery-post';
import { Packed } from '@/misc/schema';
import { Users, DriveFiles, GalleryLikes } from '../index';
import { awaitAll } from '@/prelude/await-all';
import { User } from '@/models/entities/user';

@EntityRepository(GalleryPost)
export class GalleryPostRepository extends Repository<GalleryPost> {
	public async pack(
		src: GalleryPost['id'] | GalleryPost,
		me?: { id: User['id'] } | null | undefined,
	): Promise<Packed<'GalleryPost'>> {
		const meId = me ? me.id : null;
		const post = typeof src === 'object' ? src : await this.findOneOrFail(src);

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
			isLiked: meId ? await GalleryLikes.findOne({ postId: post.id, userId: meId }).then(x => x != null) : undefined,
		});
	}

	public packMany(
		posts: GalleryPost[],
		me?: { id: User['id'] } | null | undefined,
	) {
		return Promise.all(posts.map(x => this.pack(x, me)));
	}
}

export const packedGalleryPostSchema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		id: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'date-time',
		},
		updatedAt: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'date-time',
		},
		title: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
		},
		description: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
		},
		userId: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
		},
		user: {
			type: 'object' as const,
			ref: 'User' as const,
			optional: false as const, nullable: false as const,
		},
		fileIds: {
			type: 'array' as const,
			optional: true as const, nullable: false as const,
			items: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				format: 'id',
			},
		},
		files: {
			type: 'array' as const,
			optional: true as const, nullable: false as const,
			items: {
				type: 'object' as const,
				optional: false as const, nullable: false as const,
				ref: 'DriveFile' as const,
			},
		},
		tags: {
			type: 'array' as const,
			optional: true as const, nullable: false as const,
			items: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
			},
		},
		isSensitive: {
			type: 'boolean' as const,
			optional: false as const, nullable: false as const,
		},
	},
};
