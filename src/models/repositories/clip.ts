import { EntityRepository, Repository } from 'typeorm';
import { Clip } from '../entities/clip';
import { SchemaType } from '../../misc/schema';
import { Users } from '..';
import { awaitAll } from '../../prelude/await-all';

export type PackedClip = SchemaType<typeof packedClipSchema>;

@EntityRepository(Clip)
export class ClipRepository extends Repository<Clip> {
	public async pack(
		src: Clip['id'] | Clip,
	): Promise<PackedClip> {
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
			description: 'The unique identifier for this Clip.',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'date-time',
			description: 'The date that the Clip was created.'
		},
		userId: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
		},
		user: {
			type: 'object' as const,
			ref: 'User',
			optional: false as const, nullable: false as const,
		},
		name: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			description: 'The name of the Clip.'
		},
		description: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			description: 'The description of the Clip.'
		},
		isPublic: {
			type: 'boolean' as const,
			optional: false as const, nullable: false as const,
			description: 'Whether this Clip is public.',
		},
	},
};
