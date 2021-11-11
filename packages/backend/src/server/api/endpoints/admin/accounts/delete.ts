import $ from 'cafy';
import define from '../../../define';
import { Users } from '@/models/index';
import { doPostSuspend } from '@/services/suspend-user';
import { publishUserEvent } from '@/services/stream';
import { createDeleteAccountJob } from '@/queue';
import { ID } from '@/misc/cafy-id';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		userId: {
			validator: $.type(ID),
		},
	}
};

export default define(meta, async (ps, me) => {
	const user = await Users.findOne(ps.userId);

	if (user == null) {
		throw new Error('user not found');
	}

	if (user.isAdmin) {
		throw new Error('cannot suspend admin');
	}

	if (user.isModerator) {
		throw new Error('cannot suspend moderator');
	}

	if (Users.isLocalUser(user)) {
		// 物理削除する前にDelete activityを送信する
		await doPostSuspend(user).catch(e => {});

		createDeleteAccountJob(user, {
			soft: false
		});
	} else {
		createDeleteAccountJob(user, {
			soft: true // リモートユーザーの削除は、完全にDBから物理削除してしまうと再度連合してきてアカウントが復活する可能性があるため、soft指定する
		});
	}

	await Users.update(user.id, {
		isDeleted: true,
	});

	if (Users.isLocalUser(user)) {
		// Terminate streaming
		publishUserEvent(user.id, 'terminate', {});
	}
});
