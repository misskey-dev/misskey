import { EntityRepository, Repository } from 'typeorm';
import { Users, DriveFiles } from '../../..';
import { ReversiGame } from '../../../entities/games/reversi/game';

@EntityRepository(ReversiGame)
export class ReversiGameRepository extends Repository<ReversiGame> {
	private async cloneOrFetch(x: ReversiGame['id'] | ReversiGame): Promise<ReversiGame> {
		if (typeof x === 'object') {
			return JSON.parse(JSON.stringify(x));
		} else {
			return await this.findOne(x);
		}
	}

	public async pack(
		game: any,
		me?: any,
		options?: {
			detail?: boolean
		}
	) {
		const opts = Object.assign({
			detail: true
		}, options);

		const _game = await this.cloneOrFetch(game);

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
