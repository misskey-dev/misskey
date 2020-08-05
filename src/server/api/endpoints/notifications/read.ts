import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import { publishMainStream } from '../../../../services/stream';
import define from '../../define';
import { Notifications } from '../../../../models';
import { readNotification } from '../../common/read-notification';

export const meta = {
	desc: {
		'ja-JP': '通知を既読にします。',
		'en-US': 'Mark a notification as read.'
	},

	tags: ['notifications', 'account'],

	requireCredential: true as const,

	params: {
		notificationId: {
			validator: $.type(ID),
			desc: {
				'ja-JP': '対象の通知のID',
				'en-US': 'Target notification ID.'
			}
		}
	},

	kind: 'write:notifications'
};

export default define(meta, async (ps, user) => {
	// Update documents
	await readNotification(user.id, [ps.notificationId]);

	// 全ての通知を読みましたよというイベントを発行
	publishMainStream(user.id, 'readAllNotifications');
});
