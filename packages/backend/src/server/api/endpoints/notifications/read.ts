import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { readNotification } from '../../common/read-notification';
import { ApiError } from '../../error';

export const meta = {
	desc: {
		'ja-JP': '通知を既読にします。',
		'en-US': 'Mark a notification as read.'
	},

	tags: ['notifications', 'account'],

	requireCredential: true,

	kind: 'write:notifications',

	params: {
		notificationId: {
			validator: $.optional.type(ID),
			desc: {
				'ja-JP': '対象の通知のID',
				'en-US': 'Target notification ID.'
			}
		},

		notificationIds: {
			validator: $.optional.arr($.type(ID)),
			desc: {
				'ja-JP': '対象の通知のIDの配列',
				'en-US': 'Target notification IDs.'
			}
		}
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	let notificationIds = [] as string[];

	if (ps.notificationId) notificationIds.push(ps.notificationId);
	if (ps.notificationIds) notificationIds = notificationIds.concat(ps.notificationIds);

	return readNotification(user.id, notificationIds);
});
