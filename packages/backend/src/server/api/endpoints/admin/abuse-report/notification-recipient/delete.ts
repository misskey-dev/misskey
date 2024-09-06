/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { IEndpointMeta } from '@/server/api/endpoints.js';
import type { ValidatableSchema } from '@/misc/json-schema.js';
import { AbuseReportNotificationService } from '@/core/AbuseReportNotificationService.js';

export const meta = {
	tags: ['admin', 'abuse-report', 'notification-recipient'],

	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'write:admin:abuse-report:notification-recipient',
} as const satisfies IEndpointMeta;

export const paramDef = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			format: 'misskey:id',
		},
	},
	required: [
		'id',
	],
} as const satisfies ValidatableSchema;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private abuseReportNotificationService: AbuseReportNotificationService,
	) {
		super(meta, paramDef, async (ps, me) => {
			await this.abuseReportNotificationService.deleteRecipient(
				ps.id,
				me,
			);
		});
	}
}
