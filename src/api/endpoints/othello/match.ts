import $ from 'cafy';
import Matching, { pack as packMatching } from '../../models/othello-matching';
import Game, { pack as packGame } from '../../models/othello-game';
import User from '../../models/user';
import { publishOthelloStream } from '../../event';
import { eighteight } from '../../../common/othello/maps';

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

		// Create game
		const game = await Game.insert({
			created_at: new Date(),
			user1_id: exist.parent_id,
			user2_id: user._id,
			user1_accepted: false,
			user2_accepted: false,
			is_started: false,
			is_ended: false,
			logs: [],
			settings: {
				map: eighteight,
				bw: 'random',
				is_llotheo: false
			}
		});

		// Reponse
		res(await packGame(game, user));

		publishOthelloStream(exist.parent_id, 'matched', await packGame(game, exist.parent_id));
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
		const matching = await Matching.insert({
			created_at: new Date(),
			parent_id: user._id,
			child_id: child._id
		});

		// Reponse
		res();

		// 招待
		publishOthelloStream(child._id, 'invited', await packMatching(matching, child));
	}
});
