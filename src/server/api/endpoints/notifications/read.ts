import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import { publishMainStream } from '../../../../services/stream';
import define from '../../define';
import { readNotification } from '../../common/read-notification';

export const meta = {
	desc: {
		'ja-JP': '通知を既読にします。',
		'en-US': 'Mark a notification as read.'
	},

	tags: ['notifications', 'account'],

	requireCredential: true as const,

	params: {
		notificationIds: {
			validator: $.arr($.type(ID)),
			desc: {
				'ja-JP': '対象の通知のIDの配列',
				'en-US': 'Target notification IDs.'
			}
		}
	},

	kind: 'write:notifications'
};

export default define(meta, async (ps, user) => readNotification(user.id, ps.notificationIds));
