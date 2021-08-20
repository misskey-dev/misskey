import { EntityRepository, Repository } from 'typeorm';
import { ReversiMatching } from '@/models/entities/games/reversi/matching';
import { Users } from '../../../index';
import { awaitAll } from '@/prelude/await-all';
import { User } from '@/models/entities/user';

@EntityRepository(ReversiMatching)
export class ReversiMatchingRepository extends Repository<ReversiMatching> {
	public async pack(
		src: ReversiMatching['id'] | ReversiMatching,
		me: { id: User['id'] }
	) {
		const matching = typeof src === 'object' ? src : await this.findOneOrFail(src);

		return await awaitAll({
			id: matching.id,
			createdAt: matching.createdAt,
			parentId: matching.parentId,
			parent: Users.pack(matching.parentId, me, {
				detail: true
			}),
			childId: matching.childId,
			child: Users.pack(matching.childId, me, {
				detail: true
			})
		});
	}
}
