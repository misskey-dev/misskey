/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type { AbuseReportNotificationService } from '@/core/AbuseReportNotificationService.js';
import type {
	AbuseReportNotificationRecipientEntityService,
} from '@/core/entities/AbuseReportNotificationRecipientEntityService.js';
import { Endpoint } from '@/server/api/endpoint-base.js';

export const meta = {
	tags: ['admin', 'abuse-report', 'notification-recipient'],

	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'read:admin:abuse-report:notification-recipient',

	res: {
		type: 'array',
		items: {
			type: 'object',
			ref: 'AbuseReportNotificationRecipient',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		method: {
			type: 'array',
			items: {
				type: 'string',
				enum: ['email', 'webhook'],
			},
		},
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		private abuseReportNotificationService: AbuseReportNotificationService,
		private abuseReportNotificationRecipientEntityService: AbuseReportNotificationRecipientEntityService,
	) {
		super(meta, paramDef, async (ps) => {
			const recipients = await this.abuseReportNotificationService.fetchRecipients({ method: ps.method });
			return this.abuseReportNotificationRecipientEntityService.packMany(recipients);
		});
	}
}
