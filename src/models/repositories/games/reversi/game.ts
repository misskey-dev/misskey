import { EntityRepository, Repository } from 'typeorm';
import { Users } from '../../..';
import { ReversiGame } from '../../../entities/games/reversi/game';

@EntityRepository(ReversiGame)
export class ReversiGameRepository extends Repository<ReversiGame> {
	public async pack(
		src: ReversiGame['id'] | ReversiGame,
		me?: any,
		options?: {
			detail?: boolean
		}
	) {
		const opts = Object.assign({
			detail: true
		}, options);

		const game = typeof src === 'object' ? src : await this.findOne(src);
		const meId = me ? typeof me === 'string' ? me : me.id : null;

		return {
			user1: await Users.pack(game.user1Id, meId),
			user2: await Users.pack(game.user2Id, meId),
			winner: game.winnerId ? await Users.pack(game.winnerId, meId) : null,
			...(opts.detail ? {
				logs: game.logs,
				map: game.map,
			} : {})
		};
	}
}
