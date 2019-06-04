import { EntityRepository, Repository } from 'typeorm';
import { Users } from '..';
import { Muting } from '../entities/muting';
import { ensure } from '../../prelude/ensure';
import { awaitAll } from '../../prelude/await-all';
import { types, bool, SchemaType } from '../../misc/schema';

export type PackedMuting = SchemaType<typeof packedMutingSchema>;

@EntityRepository(Muting)
export class MutingRepository extends Repository<Muting> {
	public async pack(
		src: Muting['id'] | Muting,
		me?: unknown
	): Promise<PackedMuting> {
		const muting = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

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
		mutings: unknown[],
		me: unknown
	) {
		return Promise.all(mutings.map(x => this.pack(x, me)));
	}
}

export const packedMutingSchema = {
	type: types.object,
	optional: bool.false, nullable: bool.false,
	properties: {
		id: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'id',
			description: 'The unique identifier for this muting.',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'date-time',
			description: 'The date that the muting was created.'
		},
		muteeId: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'id',
		},
		mutee: {
			type: types.object,
			optional: bool.false, nullable: bool.false,
			ref: 'User',
			description: 'The mutee.'
		},
	}
};
