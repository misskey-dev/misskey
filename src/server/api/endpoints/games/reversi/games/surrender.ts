import $ from 'cafy';
import ID, { transform } from '../../../../../../misc/cafy-id';
import ReversiGame, { pack } from '../../../../../../models/games/reversi/game';
import { publishReversiGameStream } from '../../../../../../services/stream';
import define from '../../../../define';

export const meta = {
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
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	const game = await ReversiGame.findOne({ _id: ps.gameId });

	if (game == null) {
		return rej('game not found');
	}

	if (game.isEnded) {
		return rej('this game is already ended');
	}

	if (!game.user1Id.equals(user._id) && !game.user2Id.equals(user._id)) {
		return rej('access denied');
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

	res();
}));
