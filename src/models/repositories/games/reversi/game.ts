import { User } from '@/models/entities/user';
import { EntityRepository, Repository } from 'typeorm';
import { Users } from '../../..';
import { ReversiGame } from '../../../entities/games/reversi/game';

@EntityRepository(ReversiGame)
export class ReversiGameRepository extends Repository<ReversiGame> {
	public async pack(
		src: ReversiGame['id'] | ReversiGame,
		me?: { id: User['id'] } | null | undefined,
		options?: {
			detail?: boolean
		}
	) {
		const opts = Object.assign({
			detail: true
		}, options);

		const game = typeof src === 'object' ? src : await this.findOneOrFail(src);

		return {
			id: game.id,
			createdAt: game.createdAt,
			startedAt: game.startedAt,
			isStarted: game.isStarted,
			isEnded: game.isEnded,
			form1: game.form1,
			form2: game.form2,
			user1Accepted: game.user1Accepted,
			user2Accepted: game.user2Accepted,
			user1Id: game.user1Id,
			user2Id: game.user2Id,
			user1: await Users.pack(game.user1Id, me),
			user2: await Users.pack(game.user2Id, me),
			winnerId: game.winnerId,
			winner: game.winnerId ? await Users.pack(game.winnerId, me) : null,
			surrendered: game.surrendered,
			black: game.black,
			bw: game.bw,
			isLlotheo: game.isLlotheo,
			canPutEverywhere: game.canPutEverywhere,
			loopedBoard: game.loopedBoard,
			...(opts.detail ? {
				logs: game.logs,
				map: game.map,
			} : {})
		};
	}
}
