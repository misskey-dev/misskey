import { EntityRepository, Repository } from 'typeorm';
import { Users } from '..';
import rap from '@prezzemolo/rap';
import { Blocking } from '../entities/blocking';

@EntityRepository(Blocking)
export class BlockingRepository extends Repository<Blocking> {
	public packMany(
		blockings: any[],
		me: any
	) {
		return Promise.all(blockings.map(x => this.pack(x, me)));
	}

	public async pack(
		blocking: Blocking['id'] | Blocking,
		me?: any
	) {
		const _blocking = typeof blocking === 'object' ? blocking : await this.findOne(blocking);

		return await rap({
			id: _blocking.id,
			blockee: Users.pack(_blocking.blockeeId, me, {
				detail: true
			})
		});
	}
}
