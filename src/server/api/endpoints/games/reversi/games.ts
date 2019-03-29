import $ from 'cafy';
import { ID } from '../../../../../misc/cafy-id';
import define from '../../../define';
import { ReversiGames } from '../../../../../models';
import { generatePaginationQuery } from '../../../common/generate-pagination-query';

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
	const query = generatePaginationQuery(ReversiGames.createQueryBuilder('game'), ps.sinceId, ps.untilId)
		.andWhere('game.isStarted = TRUE');

	if (ps.my) {
		query.andWhere('game.user1Id = :userId OR game.user2Id = :userId', { userId: user.id });
	}

	// Fetch games
	const games = await query.take(ps.limit).getMany();

	return await Promise.all(games.map((g) => ReversiGames.pack(g, user, {
		detail: false
	})));
});
