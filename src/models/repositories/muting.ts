import { EntityRepository, Repository } from 'typeorm';
import { Users } from '..';
import rap from '@prezzemolo/rap';
import { Muting } from '../entities/muting';

@EntityRepository(Muting)
export class MutingRepository extends Repository<Muting> {
	private async cloneOrFetch(x: Muting['id'] | Muting): Promise<Muting> {
		if (typeof x === 'object') {
			return JSON.parse(JSON.stringify(x));
		} else {
			return await this.findOne(x);
		}
	}

	public packMany(
		mutings: any[],
		me: any
	) {
		return Promise.all(mutings.map(x => this.pack(x, me)));
	}

	public async pack(
		muting: any,
		me?: any
	) {
		const _muting = await this.cloneOrFetch(muting);

		return await rap({
			id: _muting.id,
			mutee: Users.pack(_muting.muteeId, me, {
				detail: true
			})
		});
	}
}
