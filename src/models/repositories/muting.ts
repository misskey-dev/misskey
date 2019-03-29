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
		src: Muting['id'] | Muting,
		me?: any
	) {
		const muting = typeof src === 'object' ? src : await this.findOne(src);

		return await rap({
			id: muting.id,
			mutee: Users.pack(muting.muteeId, me, {
				detail: true
			})
		});
	}
}
