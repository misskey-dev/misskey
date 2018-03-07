import $ from 'cafy';
import Matching from '../../models/othello-matchig';
import Game, { pack } from '../../models/othello-game';
import User from '../../models/user';
import { publishOthelloStream } from '../../event';

module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'user_id' parameter
	const [childId, childIdErr] = $(params.user_id).id().$;
	if (childIdErr) return rej('invalid user_id param');

	// Myself
	if (childId.equals(user._id)) {
		return rej('invalid user_id param');
	}

	// Find session
	const exist = await Matching.findOne({
		parent_id: childId,
		child_id: user._id
	});

	if (exist) {
		// Destroy session
		Matching.remove({
			_id: exist._id
		});

		const parentIsBlack = Math.random() > 0.5;

		// Start game
		const game = await Game.insert({
			created_at: new Date(),
			black_user_id: parentIsBlack ? exist.parent_id : user._id,
			white_user_id: parentIsBlack ? user._id : exist.parent_id,
			logs: []
		});

		const packedGame = await pack(game);

		// Reponse
		res(packedGame);

		publishOthelloStream(exist.parent_id, 'matched', {
			game
		});
	} else {
		// Fetch child
		const child = await User.findOne({
			_id: childId
		}, {
			fields: {
				_id: true
			}
		});

		if (child === null) {
			return rej('user not found');
		}

		// 以前のセッションはすべて削除しておく
		await Matching.remove({
			parent_id: user._id
		});

		// セッションを作成
		await Matching.insert({
			parent_id: user._id,
			child_id: child._id
		});

		// Reponse
		res(204);

		// 招待
		publishOthelloStream(child._id, 'invited', {
			user_id: user._id
		});
	}
});
