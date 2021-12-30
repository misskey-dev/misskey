import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import Reversi from '../../../../../../games/reversi/core';
import define from '../../../../define';
import { ApiError } from '../../../../error';
import { ReversiGames } from '@/models/index';

export const meta = {
	tags: ['games'],

	params: {
		gameId: {
			validator: $.type(ID),
		},
	},

	errors: {
		noSuchGame: {
			message: 'No such game.',
			code: 'NO_SUCH_GAME',
			id: 'f13a03db-fae1-46c9-87f3-43c8165419e1',
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: {
				id: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
					format: 'id',
				},
				createdAt: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
					format: 'date-time',
				},
				startedAt: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
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
					default: false,
				},
				user2Accepted: {
					type: 'boolean' as const,
					optional: false as const, nullable: false as const,
					default: false,
				},
				user1Id: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
					format: 'id',
				},
				user2Id: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
					format: 'id',
				},
				user1: {
					type: 'object' as const,
					optional: false as const, nullable: false as const,
					ref: 'User',
				},
				user2: {
					type: 'object' as const,
					optional: false as const, nullable: false as const,
					ref: 'User',
				},
				winnerId: {
					type: 'string' as const,
					optional: false as const, nullable: true as const,
					format: 'id',
				},
				winner: {
					type: 'object' as const,
					optional: false as const, nullable: true as const,
					ref: 'User',
				},
				surrendered: {
					type: 'string' as const,
					optional: false as const, nullable: true as const,
					format: 'id',
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
				board: {
					type: 'array' as const,
					optional: false as const, nullable: false as const,
					items: {
						type: 'any' as const,
						optional: false as const, nullable: false as const,
					},
				},
				turn: {
					type: 'any' as const,
					optional: false as const, nullable: false as const,
				},
			},
		},
	},
};

export default define(meta, async (ps, user) => {
	const game = await ReversiGames.findOne(ps.gameId);

	if (game == null) {
		throw new ApiError(meta.errors.noSuchGame);
	}

	const o = new Reversi(game.map, {
		isLlotheo: game.isLlotheo,
		canPutEverywhere: game.canPutEverywhere,
		loopedBoard: game.loopedBoard,
	});

	for (const log of game.logs) {
		o.put(log.color, log.pos);
	}

	const packed = await ReversiGames.pack(game, user);

	return Object.assign({
		board: o.board,
		turn: o.turn,
	}, packed);
});
