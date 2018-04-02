import $ from 'cafy';
import Matching, { pack as packMatching } from '../../../../models/othello-matching';
import OthelloGame, { pack as packGame } from '../../../../models/othello-game';
import User from '../../../../models/user';
import publishUserStream, { publishOthelloStream } from '../../../../event';
import { eighteight } from '../../../../othello/maps';

module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'userId' parameter
	const [childId, childIdErr] = $(params.userId).id().$;
	if (childIdErr) return rej('invalid userId param');

	// Myself
	if (childId.equals(user._id)) {
		return rej('invalid userId param');
	}

	// Find session
	const exist = await Matching.findOne({
		parentId: childId,
		childId: user._id
	});

	if (exist) {
		// Destroy session
		Matching.remove({
			_id: exist._id
		});

		// Create game
		const game = await OthelloGame.insert({
			createdAt: new Date(),
			user1Id: exist.parentId,
			user2Id: user._id,
			user1Accepted: false,
			user2Accepted: false,
			isStarted: false,
			isEnded: false,
			logs: [],
			settings: {
				map: eighteight.data,
				bw: 'random',
				isLlotheo: false
			}
		});

		// Reponse
		res(await packGame(game, user));

		publishOthelloStream(exist.parentId, 'matched', await packGame(game, exist.parentId));

		const other = await Matching.count({
			childId: user._id
		});

		if (other == 0) {
			publishUserStream(user._id, 'othello_no_invites');
		}
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
			parentId: user._id
		});

		// セッションを作成
		const matching = await Matching.insert({
			createdAt: new Date(),
			parentId: user._id,
			childId: child._id
		});

		// Reponse
		res();

		const packed = await packMatching(matching, child);

		// 招待
		publishOthelloStream(child._id, 'invited', packed);

		publishUserStream(child._id, 'othello_invited', packed);
	}
});
