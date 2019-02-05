import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import Matching, { pack as packMatching } from '../../../../../models/games/reversi/matching';
import ReversiGame, { pack as packGame } from '../../../../../models/games/reversi/game';
import User from '../../../../../models/user';
import { publishMainStream, publishReversiStream } from '../../../../../services/stream';
import { eighteight } from '../../../../../games/reversi/maps';
import define from '../../../define';

export const meta = {
	requireCredential: true,

	params: {
		userId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
		},
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	// Myself
	if (ps.userId.equals(user._id)) {
		return rej('invalid userId param');
	}

	// Find session
	const exist = await Matching.findOne({
		parentId: ps.userId,
		childId: user._id
	});

	if (exist) {
		// Destroy session
		Matching.remove({
			_id: exist._id
		});

		// Create game
		const game = await ReversiGame.insert({
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

		publishReversiStream(exist.parentId, 'matched', await packGame(game, exist.parentId));

		const other = await Matching.count({
			childId: user._id
		});

		if (other == 0) {
			publishMainStream(user._id, 'reversiNoInvites');
		}
	} else {
		// Fetch child
		const child = await User.findOne({
			_id: ps.userId
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
		publishReversiStream(child._id, 'invited', packed);

		publishMainStream(child._id, 'reversiInvited', packed);
	}
}));
