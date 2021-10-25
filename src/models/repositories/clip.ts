import { EntityRepository, Repository } from 'typeorm';
import { Clip } from '@/models/entities/clip';
import { Packed } from '@/misc/schema';
import { Users } from '../index';
import { awaitAll } from '@/prelude/await-all';

@EntityRepository(Clip)
export class ClipRepository extends Repository<Clip> {
	public async pack(
		src: Clip['id'] | Clip,
	): Promise<Packed<'Clip'>> {
		const clip = typeof src === 'object' ? src : await this.findOneOrFail(src);

		return await awaitAll({
			id: clip.id,
			createdAt: clip.createdAt.toISOString(),
			userId: clip.userId,
			user: Users.pack(clip.user || clip.userId),
			name: clip.name,
			description: clip.description,
			isPublic: clip.isPublic,
		});
	}

	public packMany(
		clips: Clip[],
	) {
		return Promise.all(clips.map(x => this.pack(x)));
	}
}

export const packedClipSchema = {
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
		name: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
		},
		description: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
		},
		isPublic: {
			type: 'boolean' as const,
			optional: false as const, nullable: false as const,
		},
	},
};
