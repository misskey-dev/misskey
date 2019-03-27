import { EntityRepository, Repository } from 'typeorm';
import { Users } from '..';
import rap from '@prezzemolo/rap';
import { Blocking } from '../entities/blocking';

@EntityRepository(Blocking)
export class BlockingRepository extends Repository<Blocking> {
	private async cloneOrFetch(x: Blocking['id'] | Blocking): Promise<Blocking> {
		if (typeof x === 'object') {
			return JSON.parse(JSON.stringify(x));
		} else {
			return await this.findOne(x);
		}
	}

	public packMany(
		blockings: any[],
		me: any
	) {
		return Promise.all(blockings.map(x => this.pack(x, me)));
	}

	public async pack(
		blocking: any,
		me?: any
	) {
		const _blocking = await this.cloneOrFetch(blocking);

		return await rap({
			id: _blocking.id,
			blockee: Users.pack(_blocking.blockeeId, me, {
				detail: true
			})
		});
	}
}
