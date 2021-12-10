import { User } from '@/models/entities/user';
import { EntityRepository, Repository } from 'typeorm';
import { Users } from '../../../index';
import { ReversiGame } from '@/models/entities/games/reversi/game';
import { Packed } from '@/misc/schema';

@EntityRepository(ReversiGame)
export class ReversiGameRepository extends Repository<ReversiGame> {
	public async pack(
		src: ReversiGame['id'] | ReversiGame,
		me?: { id: User['id'] } | null | undefined,
		options?: {
			detail?: boolean
		}
	): Promise<Packed<'ReversiGame'>> {
		const opts = Object.assign({
			detail: true,
		}, options);

		const game = typeof src === 'object' ? src : await this.findOneOrFail(src);

		return {
			id: game.id,
			createdAt: game.createdAt.toISOString(),
			startedAt: game.startedAt && game.startedAt.toISOString(),
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
				logs: game.logs.map(log => ({
					at: log.at.toISOString(),
					color: log.color,
					pos: log.pos,
				})),
				map: game.map,
			} : {}),
		};
	}
}

export const packedReversiGameSchema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		id: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'date-time',
		},
		startedAt: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			format: 'date-time',
		},
		isStarted: {
			type: 'boolean' as const,
			optional: false as const, nullable: false as const,
		},
		isEnded: {
			type: 'boolean' as const,
			optional: false as const, nullable: false as const,
		},
		form1: {
			type: 'any' as const,
			optional: false as const, nullable: true as const,
		},
		form2: {
			type: 'any' as const,
			optional: false as const, nullable: true as const,
		},
		user1Accepted: {
			type: 'boolean' as const,
			optional: false as const, nullable: false as const,
		},
		user2Accepted: {
			type: 'boolean' as const,
			optional: false as const, nullable: false as const,
		},
		user1Id: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		user2Id: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		user1: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'User' as const,
		},
		user2: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'User' as const,
		},
		winnerId: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		winner: {
			type: 'object' as const,
			optional: false as const, nullable: true as const,
			ref: 'User' as const,
		},
		surrendered: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		black: {
			type: 'number' as const,
			optional: false as const, nullable: true as const,
		},
		bw: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
		},
		isLlotheo: {
			type: 'boolean' as const,
			optional: false as const, nullable: false as const,
		},
		canPutEverywhere: {
			type: 'boolean' as const,
			optional: false as const, nullable: false as const,
		},
		loopedBoard: {
			type: 'boolean' as const,
			optional: false as const, nullable: false as const,
		},
		logs: {
			type: 'array' as const,
			optional: true as const, nullable: false as const,
			items: {
				type: 'object' as const,
				optional: true as const, nullable: false as const,
				properties: {
					at: {
						type: 'string' as const,
						optional: false as const, nullable: false as const,
						format: 'date-time',
					},
					color: {
						type: 'boolean' as const,
						optional: false as const, nullable: false as const,
					},
					pos: {
						type: 'number' as const,
						optional: false as const, nullable: false as const,
					},
				},
			},
		},
		map: {
			type: 'array' as const,
			optional: true as const, nullable: false as const,
			items: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
			},
		},
	},
};
