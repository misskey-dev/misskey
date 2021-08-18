import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import { publishReversiGameStream } from '../../../../../../services/stream';
import define from '../../../../define';
import { ApiError } from '../../../../error';
import { ReversiGames } from '../../../../../../models';

export const meta = {
	tags: ['games'],

	requireCredential: true as const,

	params: {
		gameId: {
			validator: $.type(ID),
		}
	},

	errors: {
		noSuchGame: {
			message: 'No such game.',
			code: 'NO_SUCH_GAME',
			id: 'ace0b11f-e0a6-4076-a30d-e8284c81b2df'
		},

		alreadyEnded: {
			message: 'That game has already ended.',
			code: 'ALREADY_ENDED',
			id: '6c2ad4a6-cbf1-4a5b-b187-b772826cfc6d'
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '6e04164b-a992-4c93-8489-2123069973e1'
		},
	}
};

export default define(meta, async (ps, user) => {
	const game = await ReversiGames.findOne(ps.gameId);

	if (game == null) {
		throw new ApiError(meta.errors.noSuchGame);
	}

	if (game.isEnded) {
		throw new ApiError(meta.errors.alreadyEnded);
	}

	if ((game.user1Id !== user.id) && (game.user2Id !== user.id)) {
		throw new ApiError(meta.errors.accessDenied);
	}

	const winnerId = game.user1Id === user.id ? game.user2Id : game.user1Id;

	await ReversiGames.update(game.id, {
		surrendered: user.id,
		isEnded: true,
		winnerId: winnerId
	});

	publishReversiGameStream(game.id, 'ended', {
		winnerId: winnerId,
		game: await ReversiGames.pack(game.id, user)
	});
});
