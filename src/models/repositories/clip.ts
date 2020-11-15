import { EntityRepository, Repository } from 'typeorm';
import { Clip } from '../entities/clip';
import { ensure } from '../../prelude/ensure';
import { SchemaType } from '../../misc/schema';

export type PackedClip = SchemaType<typeof packedClipSchema>;

@EntityRepository(Clip)
export class ClipRepository extends Repository<Clip> {
	public async pack(
		src: Clip['id'] | Clip,
	): Promise<PackedClip> {
		const clip = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		return {
			id: clip.id,
			createdAt: clip.createdAt.toISOString(),
			name: clip.name,
			description: clip.description,
		};
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
	},
};
