import { Inject, Injectable } from '@nestjs/common';
import { publishMainStream } from '@/services/stream.js';
import { pushNotification } from '@/services/push-notification.js';
import { Notifications } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';

export const meta = {
	tags: ['notifications', 'account'],

	requireCredential: true,

	kind: 'write:notifications',
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('usersRepository')
    private usersRepository: typeof Users,

		@Inject('notesRepository')
    private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, user) => {
			// Update documents
			await Notifications.update({
				notifieeId: user.id,
				isRead: false,
			}, {
				isRead: true,
			});

			// 全ての通知を読みましたよというイベントを発行
			publishMainStream(user.id, 'readAllNotifications');
			pushNotification(user.id, 'readAllNotifications', undefined);
		});
	}
}
