import $ from 'cafy';
import { ID } from '~/misc/cafy-id';
import define from '~/server/api/define';
import { ReversiGames } from '~/models';
import { makePaginationQuery } from '~/server/api/common/make-pagination-query';
import { Brackets } from 'typeorm';

export const meta = {
	tags: ['games'],

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		},

		my: {
			validator: $.optional.bool,
			default: false
		}
	}
};

export default define(meta, async (ps, user) => {
	const query = makePaginationQuery(ReversiGames.createQueryBuilder('game'), ps.sinceId, ps.untilId)
		.andWhere('game.isStarted = TRUE');

	if (ps.my) {
		query.andWhere(new Brackets(qb => { qb
			.where('game.user1Id = :userId', { userId: user.id })
			.orWhere('game.user2Id = :userId', { userId: user.id });
		}));
	}

	// Fetch games
	const games = await query.take(ps.limit!).getMany();

	return await Promise.all(games.map((g) => ReversiGames.pack(g, user, {
		detail: false
	})));
});
