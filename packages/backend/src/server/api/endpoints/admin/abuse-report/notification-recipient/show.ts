/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import {
	AbuseReportNotificationRecipientEntityService,
} from '@/core/entities/AbuseReportNotificationRecipientEntityService.js';
import { AbuseReportNotificationService } from '@/core/AbuseReportNotificationService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['admin', 'abuse-report', 'notification-recipient'],

	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'read:admin:abuse-report:notification-recipient',

	res: {
		type: 'object',
		ref: 'AbuseReportNotificationRecipient',
	},

	errors: {
		noSuchRecipient: {
			message: 'No such recipient.',
			code: 'NO_SUCH_RECIPIENT',
			id: '013de6a8-f757-04cb-4d73-cc2a7e3368e4',
			kind: 'server',
			httpStatusCode: 404,
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			format: 'misskey:id',
		},
	},
	required: ['id'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private abuseReportNotificationService: AbuseReportNotificationService,
		private abuseReportNotificationRecipientEntityService: AbuseReportNotificationRecipientEntityService,
	) {
		super(meta, paramDef, async (ps) => {
			const recipients = await this.abuseReportNotificationService.fetchRecipients({ ids: [ps.id] });
			if (recipients.length === 0) {
				throw new ApiError(meta.errors.noSuchRecipient);
			}

			return this.abuseReportNotificationRecipientEntityService.pack(recipients[0]);
		});
	}
}
