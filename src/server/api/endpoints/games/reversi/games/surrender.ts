import $ from 'cafy';
import ID, { transform } from '../../../../../../misc/cafy-id';
import ReversiGame, { pack } from '../../../../../../models/games/reversi/game';
import { publishReversiGameStream } from '../../../../../../services/stream';
import define from '../../../../define';
import { ApiError } from '../../../../error';

export const meta = {
	tags: ['games'],

	desc: {
		'ja-JP': '指定したリバーシの対局で投了します。'
	},

	requireCredential: true,

	params: {
		gameId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '投了したい対局'
			}
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
	const game = await ReversiGame.findOne({ _id: ps.gameId });

	if (game == null) {
		throw new ApiError(meta.errors.noSuchGame);
	}

	if (game.isEnded) {
		throw new ApiError(meta.errors.alreadyEnded);
	}

	if (!game.user1Id.equals(user._id) && !game.user2Id.equals(user._id)) {
		throw new ApiError(meta.errors.accessDenied);
	}

	const winnerId = game.user1Id.equals(user._id) ? game.user2Id : game.user1Id;

	await ReversiGame.update({
		_id: game._id
	}, {
		$set: {
			surrendered: user._id,
			isEnded: true,
			winnerId: winnerId
		}
	});

	publishReversiGameStream(game._id, 'ended', {
		winnerId: winnerId,
		game: await pack(game._id, user)
	});

	return;
});
