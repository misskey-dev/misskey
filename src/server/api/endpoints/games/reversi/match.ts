import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import Matching, { pack as packMatching } from '../../../../../models/games/reversi/matching';
import ReversiGame, { pack as packGame } from '../../../../../models/games/reversi/game';
import { publishMainStream, publishReversiStream } from '../../../../../services/stream';
import { eighteight } from '../../../../../games/reversi/maps';
import define from '../../../define';
import { ApiError } from '../../../error';
import { getUser } from '../../../common/getters';

export const meta = {
	tags: ['games'],

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
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '0b4f0559-b484-4e31-9581-3f73cee89b28'
		},

		isYourself: {
			message: 'Target user is yourself.',
			code: 'TARGET_IS_YOURSELF',
			id: '96fd7bd6-d2bc-426c-a865-d055dcd2828e'
		},
	}
};

export default define(meta, async (ps, user) => {
	// Myself
	if (ps.userId.equals(user._id)) {
		throw new ApiError(meta.errors.isYourself);
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

		publishReversiStream(exist.parentId, 'matched', await packGame(game, exist.parentId));

		const other = await Matching.count({
			childId: user._id
		});

		if (other == 0) {
			publishMainStream(user._id, 'reversiNoInvites');
		}

		return await packGame(game, user);
	} else {
		// Fetch child
		const child = await getUser(ps.userId).catch(e => {
			if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
			throw e;
		});

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

		const packed = await packMatching(matching, child);
		publishReversiStream(child._id, 'invited', packed);
		publishMainStream(child._id, 'reversiInvited', packed);

		return;
	}
});
