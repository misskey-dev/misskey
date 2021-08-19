import { EntityRepository, Repository } from 'typeorm';
import { Users } from '../index';
import { Muting } from '@/models/entities/muting';
import { awaitAll } from '@/prelude/await-all';
import { SchemaType } from '@/misc/schema';
import { User } from '@/models/entities/user';

export type PackedMuting = SchemaType<typeof packedMutingSchema>;

@EntityRepository(Muting)
export class MutingRepository extends Repository<Muting> {
	public async pack(
		src: Muting['id'] | Muting,
		me?: { id: User['id'] } | null | undefined
	): Promise<PackedMuting> {
		const muting = typeof src === 'object' ? src : await this.findOneOrFail(src);

		return await awaitAll({
			id: muting.id,
			createdAt: muting.createdAt.toISOString(),
			muteeId: muting.muteeId,
			mutee: Users.pack(muting.muteeId, me, {
				detail: true
			})
		});
	}

	public packMany(
		mutings: any[],
		me: { id: User['id'] }
	) {
		return Promise.all(mutings.map(x => this.pack(x, me)));
	}
}

export const packedMutingSchema = {
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
		muteeId: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
		},
		mutee: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'User',
		},
	}
};
