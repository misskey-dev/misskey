import { EntityRepository, Repository } from 'typeorm';
import rap from '@prezzemolo/rap';
import { ReversiMatching } from '../../../entities/games/reversi/matching';
import { Users } from '../../..';

@EntityRepository(ReversiMatching)
export class ReversiMatchingRepository extends Repository<ReversiMatching> {
	public async pack(
		matching: ReversiMatching['id'] | ReversiMatching,
		me: any
	) {
		const _matching = typeof matching === 'object' ? matching : await this.findOne(matching);

		return await rap({
			id: _matching.id,
			parent: Users.pack(_matching.parentId, me, {
				detail: true
			}),
			child: Users.pack(_matching.childId, me, {
				detail: true
			})
		});
	}
}
