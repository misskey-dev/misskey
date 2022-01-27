import { EntityRepository, Repository } from 'typeorm';
import { Users } from '../index';
import { Blocking } from '@/models/entities/blocking';
import { awaitAll } from '@/prelude/await-all';
import { Packed } from '@/misc/schema';
import { User } from '@/models/entities/user';

@EntityRepository(Blocking)
export class BlockingRepository extends Repository<Blocking> {
	public async pack(
		src: Blocking['id'] | Blocking,
		me?: { id: User['id'] } | null | undefined
	): Promise<Packed<'Blocking'>> {
		const blocking = typeof src === 'object' ? src : await this.findOneOrFail(src);

		return await awaitAll({
			id: blocking.id,
			createdAt: blocking.createdAt.toISOString(),
			blockeeId: blocking.blockeeId,
			blockee: Users.pack(blocking.blockeeId, me, {
				detail: true,
			}),
		});
	}

	public packMany(
		blockings: any[],
		me: { id: User['id'] }
	) {
		return Promise.all(blockings.map(x => this.pack(x, me)));
	}
}
