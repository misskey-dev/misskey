import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import define from '../../define';
import User, { IUser, isLocalUser, isRemoteUser } from '../../../../models/user';
import Following from '../../../../models/following';
import perUserFollowingChart from '../../../../services/chart/per-user-following';
import { renderActivity } from '../../../../remote/activitypub/renderer';
import renderFollow from '../../../../remote/activitypub/renderer/follow';
import renderUndo from '../../../../remote/activitypub/renderer/undo';
import { deliver } from '../../../../queue';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーを凍結します。',
		'en-US': 'Suspend a user.'
	},

	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		userId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のユーザーID',
				'en-US': 'The user ID which you want to suspend'
			}
		},
	}
};

export default define(meta, async (ps) => {
	const user = await User.findOne({
		_id: ps.userId
	});

	if (user == null) {
		throw new Error('user not found');
	}

	if (user.isAdmin) {
		throw new Error('cannot suspend admin');
	}

	if (user.isModerator) {
		throw new Error('cannot suspend moderator');
	}

	await User.findOneAndUpdate({
		_id: user._id
	}, {
		$set: {
			isSuspended: true
		}
	});

	unFollowAll(user);

	return;
});

async function unFollowAll(follower: IUser) {
	const followings = await Following.find({
		followerId: follower._id
	});

	for (const following of followings) {
		const followee = await User.findOne({
			_id: following.followeeId
		});

		if (followee == null) {
			throw `Cant find followee ${following.followeeId}`;
		}

		Following.remove({
			_id: following._id
		});

		//#region Decrement following count
		User.update({ _id: follower._id }, {
			$inc: {
				followingCount: -1
			}
		});
		//#endregion

		//#region Decrement followers count
		User.update({ _id: followee._id }, {
			$inc: {
				followersCount: -1
			}
		});
		//#endregion

		perUserFollowingChart.update(follower, followee, false);

		// リモートにフォローをしていたらUndoFollow送信
		if (isLocalUser(follower) && isRemoteUser(followee)) {
			const content = renderActivity(renderUndo(renderFollow(follower, followee), follower));
			deliver(follower, content, followee.inbox);
		}
	}
}
