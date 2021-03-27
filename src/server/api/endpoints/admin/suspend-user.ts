import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import deleteFollowing from '../../../../services/following/delete';
import { Users, Followings, Notifications } from '../../../../models';
import { User } from '../../../../models/entities/user';
import { insertModerationLog } from '../../../../services/insert-moderation-log';
import { doPostSuspend } from '../../../../services/suspend-user';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーを凍結します。',
		'en-US': 'Suspend a user.'
	},

	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		userId: {
			validator: $.type(ID),
			desc: {
				'ja-JP': '対象のユーザーID',
				'en-US': 'The user ID which you want to suspend'
			}
		},
	}
};

export default define(meta, async (ps, me) => {
	const user = await Users.findOne(ps.userId as string);

	if (user == null) {
		throw new Error('user not found');
	}

	if (user.isAdmin) {
		throw new Error('cannot suspend admin');
	}

	if (user.isModerator) {
		throw new Error('cannot suspend moderator');
	}

	await Users.update(user.id, {
		isSuspended: true
	});

	insertModerationLog(me, 'suspend', {
		targetId: user.id,
	});

	(async () => {
		await doPostSuspend(user).catch(e => {});
		await unFollowAll(user).catch(e => {});
		await readAllNotify(user).catch(e => {});
	})();
});

async function unFollowAll(follower: User) {
	const followings = await Followings.find({
		followerId: follower.id
	});

	for (const following of followings) {
		const followee = await Users.findOne({
			id: following.followeeId
		});

		if (followee == null) {
			throw `Cant find followee ${following.followeeId}`;
		}

		await deleteFollowing(follower, followee, true);
	}
}

async function readAllNotify(notifier: User) {
	await Notifications.update({
		notifierId: notifier.id,
		isRead: false,
	}, {
		isRead: true
	});
}
