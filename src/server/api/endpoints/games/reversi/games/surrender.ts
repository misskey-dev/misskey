import $ from 'cafy'; import ID, { transform } from '../../../../../../misc/cafy-id';
import ReversiGame, { pack } from '../../../../../../models/games/reversi/game';
import { publishReversiGameStream } from '../../../../../../stream';
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

export default define(meta, (ps, user) => ReversiGame.findOne({ _id: ps.gameId })
	.then(async x => {
		if (!x) throw 'game not found';
		if (x.isEnded) throw 'this game is already ended';
		if (!x.user1Id.equals(user._id) && !x.user2Id.equals(user._id)) throw 'access denied';
		const winnerId = x.user1Id.equals(user._id) ? x.user2Id : x.user1Id;
		await ReversiGame.update({ _id: x._id }, {
			$set: {
				surrendered: user._id,
				isEnded: true,
				winnerId
			}
		});
		publishReversiGameStream(x._id, 'ended', {
			winnerId,
			game: await pack(x._id, user)
		});
	}));
