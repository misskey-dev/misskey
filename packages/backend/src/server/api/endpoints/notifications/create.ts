import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { CreateNotificationService } from '@/core/CreateNotificationService.js';

export const meta = {
	tags: ['notifications'],

	requireCredential: true,

	kind: 'write:notifications',

	errors: {
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		body: { type: 'string' },
		header: { type: 'string', nullable: true },
		icon: { type: 'string', nullable: true },
	},
	required: ['body'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		private createNotificationService: CreateNotificationService,
	) {
		super(meta, paramDef, async (ps, user, token) => {
			this.createNotificationService.createNotification(user.id, 'app', {
				appAccessTokenId: token ? token.id : null,
				customBody: ps.body,
				customHeader: ps.header,
				customIcon: ps.icon,
			});
		});
	}
}
