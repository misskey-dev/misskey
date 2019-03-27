import { EntityRepository, Repository } from 'typeorm';
import { Users } from '..';
import rap from '@prezzemolo/rap';
import { Muting } from '../entities/muting';

@EntityRepository(Muting)
export class MutingRepository extends Repository<Muting> {
	public packMany(
		mutings: any[],
		me: any
	) {
		return Promise.all(mutings.map(x => this.pack(x, me)));
	}

	public async pack(
		muting: Muting['id'] | Muting,
		me?: any
	) {
		const _muting = typeof muting === 'object' ? muting : await this.findOne(muting);

		return await rap({
			id: _muting.id,
			mutee: Users.pack(_muting.muteeId, me, {
				detail: true
			})
		});
	}
}
