import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import Matching, { pack as packMatching, IMatching } from '../../../../../models/games/reversi/matching';
import ReversiGame, { pack as packGame } from '../../../../../models/games/reversi/game';
import User, { ILocalUser } from '../../../../../models/user';
import { publishMainStream, publishReversiStream } from '../../../../../stream';
import { eighteight } from '../../../../../games/reversi/maps';
import define from '../../../define';
import { ObjectID } from 'mongodb';
import { error } from '../../../../../prelude/promise';

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

const whenExist = async (user: ILocalUser, matching: IMatching) => {
	Matching.remove({ _id: matching._id });
	const result = await ReversiGame.insert({
		createdAt: new Date(),
		user1Id: matching.parentId,
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
	})
	.then(x => packGame(x, user));
	packGame(result, matching.parentId)
		.then(x => publishReversiStream(matching.parentId, 'matched', x));
	if (!await Matching.count({ childId: user._id })) publishMainStream(user._id, 'reversiNoInvites');
};

const whenNotExist = (user: ILocalUser, childId: ObjectID) => User.findOne({ _id: childId }, {
		fields: { _id: true }
	})
	.then(async child => {
		if (child === null) throw 'user not found';
		await Matching.remove({ parentId: user._id });
		const matching = await Matching.insert({
			createdAt: new Date(),
			parentId: user._id,
			childId
		});
		packMatching(matching, child)
			.then(x => {
				publishReversiStream(child._id, 'invited', x);
				publishMainStream(child._id, 'reversiInvited', x);
			});
	});

export default define(meta, (ps, user) => Promise.resolve()
	.then(async () =>
		ps.userId.equals(user._id) ? error('invalid userId param') :
		Matching.findOne({
			parentId: ps.userId,
			childId: user._id
		}))
	.then(x => x ? whenExist(user, x) : whenNotExist(user, x.childId)));
