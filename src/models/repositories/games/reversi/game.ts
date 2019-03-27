import { EntityRepository, Repository } from 'typeorm';
import { Users } from '../../..';
import { ReversiGame } from '../../../entities/games/reversi/game';

@EntityRepository(ReversiGame)
export class ReversiGameRepository extends Repository<ReversiGame> {
	public async pack(
		game: ReversiGame['id'] | ReversiGame,
		me?: any,
		options?: {
			detail?: boolean
		}
	) {
		const opts = Object.assign({
			detail: true
		}, options);

		const _game = typeof game === 'object' ? game : await this.findOne(game);
		const meId = me ? typeof me === 'string' ? me : me.id : null;

		return {
			user1: await Users.pack(_game.user1Id, meId),
			user2: await Users.pack(_game.user2Id, meId),
			winner: _game.winnerId ? await Users.pack(_game.winnerId, meId) : null,
			...(opts.detail ? {
				logs: _game.logs,
				map: _game.map,
			} : {})
		};
	}
}
