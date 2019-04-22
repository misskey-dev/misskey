import { EntityRepository, Repository } from 'typeorm';
import { Users } from '..';
import { Blocking } from '../entities/blocking';
import { ensure } from '../../prelude/ensure';

@EntityRepository(Blocking)
export class BlockingRepository extends Repository<Blocking> {
	public packMany(
		blockings: any[],
		me: any
	) {
		return Promise.all(blockings.map(x => this.pack(x, me)));
	}

	public async pack(
		src: Blocking['id'] | Blocking,
		me?: any
	) {
		const blocking = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		return await rap({
			id: blocking.id,
			blockee: Users.pack(blocking.blockeeId, me, {
				detail: true
			})
		});
	}
}
