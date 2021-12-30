import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../../define';
import { ReversiGames } from '@/models/index';
import { makePaginationQuery } from '../../../common/make-pagination-query';
import { Brackets } from 'typeorm';

export const meta = {
	tags: ['games'],

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10,
		},

		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		},

		my: {
			validator: $.optional.bool,
			default: false,
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
			},
		},
	},
};

export default define(meta, async (ps, user) => {
	const query = makePaginationQuery(ReversiGames.createQueryBuilder('game'), ps.sinceId, ps.untilId)
		.andWhere('game.isStarted = TRUE');

	if (ps.my && user) {
		query.andWhere(new Brackets(qb => { qb
			.where('game.user1Id = :userId', { userId: user.id })
			.orWhere('game.user2Id = :userId', { userId: user.id });
		}));
	}

	// Fetch games
	const games = await query.take(ps.limit!).getMany();

	return await Promise.all(games.map((g) => ReversiGames.pack(g, user, {
		detail: false,
	})));
});
