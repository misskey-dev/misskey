import { EntityRepository, Repository } from 'typeorm';
import { Users } from '..';
import { Blocking } from '../entities/blocking';
import { ensure } from '../../prelude/ensure';
import { awaitAll } from '../../prelude/await-all';
import { SchemaType, types, bool } from '../../misc/schema';

export type PackedBlocking = SchemaType<typeof packedBlockingSchema>;

@EntityRepository(Blocking)
export class BlockingRepository extends Repository<Blocking> {
	public async pack(
		src: Blocking['id'] | Blocking,
		me?: unknown
	): Promise<PackedBlocking> {
		const blocking = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		return await awaitAll({
			id: blocking.id,
			createdAt: blocking.createdAt.toISOString(),
			blockeeId: blocking.blockeeId,
			blockee: Users.pack(blocking.blockeeId, me, {
				detail: true
			})
		});
	}

	public packMany(
		blockings: unknown[],
		me: unknown
	) {
		return Promise.all(blockings.map(x => this.pack(x, me)));
	}
}

export const packedBlockingSchema = {
	type: types.object,
	optional: bool.false, nullable: bool.false,
	properties: {
		id: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'id',
			description: 'The unique identifier for this blocking.',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'date-time',
			description: 'The date that the blocking was created.'
		},
		blockeeId: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'id',
		},
		blockee: {
			type: types.object,
			optional: bool.false, nullable: bool.false,
			ref: 'User',
			description: 'The blockee.'
		},
	}
};
