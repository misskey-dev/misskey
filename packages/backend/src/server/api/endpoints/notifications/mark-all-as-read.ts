import { Inject, Injectable } from '@nestjs/common';
import type { NotificationsRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { PushNotificationService } from '@/core/PushNotificationService.js';
import { DI } from '@/di-symbols.js';

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
		@Inject(DI.notificationsRepository)
		private notificationsRepository: NotificationsRepository,

		private globalEventService: GlobalEventService,
		private pushNotificationService: PushNotificationService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Update documents
			await this.notificationsRepository.update({
				notifieeId: me.id,
				isRead: false,
			}, {
				isRead: true,
			});

			// 全ての通知を読みましたよというイベントを発行
			this.globalEventService.publishMainStream(me.id, 'readAllNotifications');
			this.pushNotificationService.pushNotification(me.id, 'readAllNotifications', undefined);
		});
	}
}
