import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import { publishMainStream, publishReversiStream } from '../../../../../services/stream';
import { eighteight } from '../../../../../games/reversi/maps';
import define from '../../../define';
import { ApiError } from '../../../error';
import { getUser } from '../../../common/getters';
import { genId } from '@/misc/gen-id';
import { ReversiMatchings, ReversiGames } from '../../../../../models';
import { ReversiGame } from '../../../../../models/entities/games/reversi/game';
import { ReversiMatching } from '../../../../../models/entities/games/reversi/matching';

export const meta = {
	tags: ['games'],

	requireCredential: true as const,

	params: {
		userId: {
			validator: $.type(ID),
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
	if (ps.userId === user.id) {
		throw new ApiError(meta.errors.isYourself);
	}

	// Find session
	const exist = await ReversiMatchings.findOne({
		parentId: ps.userId,
		childId: user.id
	});

	if (exist) {
		// Destroy session
		ReversiMatchings.delete(exist.id);

		// Create game
		const game = await ReversiGames.save({
			id: genId(),
			createdAt: new Date(),
			user1Id: exist.parentId,
			user2Id: user.id,
			user1Accepted: false,
			user2Accepted: false,
			isStarted: false,
			isEnded: false,
			logs: [],
			map: eighteight.data,
			bw: 'random',
			isLlotheo: false
		} as Partial<ReversiGame>);

		publishReversiStream(exist.parentId, 'matched', await ReversiGames.pack(game, { id: exist.parentId }));

		const other = await ReversiMatchings.count({
			childId: user.id
		});

		if (other == 0) {
			publishMainStream(user.id, 'reversiNoInvites');
		}

		return await ReversiGames.pack(game, user);
	} else {
		// Fetch child
		const child = await getUser(ps.userId).catch(e => {
			if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
			throw e;
		});

		// 以前のセッションはすべて削除しておく
		await ReversiMatchings.delete({
			parentId: user.id
		});

		// セッションを作成
		const matching = await ReversiMatchings.save({
			id: genId(),
			createdAt: new Date(),
			parentId: user.id,
			childId: child.id
		} as ReversiMatching);

		const packed = await ReversiMatchings.pack(matching, child);
		publishReversiStream(child.id, 'invited', packed);
		publishMainStream(child.id, 'reversiInvited', packed);

		return;
	}
});
