import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import define from '../../define';
import User, { IUser } from '../../../../models/user';
import Following from '../../../../models/following';
import deleteFollowing from '../../../../services/following/delete';

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

		await deleteFollowing(follower, followee, true);
	}
}
