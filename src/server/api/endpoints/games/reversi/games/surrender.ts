import $ from 'cafy'; import ID from '../../../../../../misc/cafy-id';
import ReversiGame, { pack } from '../../../../../../models/games/reversi/game';
import { ILocalUser } from '../../../../../../models/user';
import getParams from '../../../../get-params';
import { publishReversiGameStream } from '../../../../../../stream';

export const meta = {
	desc: {
		'ja-JP': '指定したリバーシの対局で投了します。'
	},

	requireCredential: true,

	params: {
		gameId: $.type(ID).note({
			desc: {
				'ja-JP': '投了したい対局'
			}
		})
	}
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

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
});
