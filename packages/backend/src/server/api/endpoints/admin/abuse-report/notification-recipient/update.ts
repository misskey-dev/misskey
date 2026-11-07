/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import {
	AbuseReportNotificationRecipientEntityService,
} from '@/core/entities/AbuseReportNotificationRecipientEntityService.js';
import { AbuseReportNotificationService } from '@/core/AbuseReportNotificationService.js';
import { DI } from '@/di-symbols.js';
import type { UserProfilesRepository } from '@/models/_.js';

export const meta = {
	tags: ['admin', 'abuse-report', 'notification-recipient'],

	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'write:admin:abuse-report:notification-recipient',

	res: {
		type: 'object',
		ref: 'AbuseReportNotificationRecipient',
	},

	errors: {
		correlationCheckEmail: {
			message: 'If "method" is email, "userId" must be set.',
			code: 'CORRELATION_CHECK_EMAIL',
			id: '348bb8ae-575a-6fe9-4327-5811999def8f',
			httpStatusCode: 400,
		},
		correlationCheckWebhook: {
			message: 'If "method" is webhook, "systemWebhookId" must be set.',
			code: 'CORRELATION_CHECK_WEBHOOK',
			id: 'b0c15051-de2d-29ef-260c-9585cddd701a',
			httpStatusCode: 400,
		},
		emailAddressNotSet: {
			message: 'Email address is not set.',
			code: 'EMAIL_ADDRESS_NOT_SET',
			id: '7cc1d85e-2f58-fc31-b644-3de8d0d3421f',
			httpStatusCode: 400,
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
		isActive: {
			type: 'boolean',
		},
		name: {
			type: 'string',
			minLength: 1,
			maxLength: 255,
		},
		method: {
			type: 'string',
			enum: ['email', 'webhook'],
		},
		userId: {
			type: 'string',
			format: 'misskey:id',
		},
		systemWebhookId: {
			type: 'string',
			format: 'misskey:id',
		},
	},
	required: [
		'id',
		'isActive',
		'name',
		'method',
	],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,
		private abuseReportNotificationService: AbuseReportNotificationService,
		private abuseReportNotificationRecipientEntityService: AbuseReportNotificationRecipientEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			if (ps.method === 'email') {
				const userProfile = await this.userProfilesRepository.findOneBy({ userId: ps.userId });
				if (!ps.userId || !userProfile) {
					throw new ApiError(meta.errors.correlationCheckEmail);
				}

				if (!userProfile.email || !userProfile.emailVerified) {
					throw new ApiError(meta.errors.emailAddressNotSet);
				}
			}

			if (ps.method === 'webhook' && !ps.systemWebhookId) {
				throw new ApiError(meta.errors.correlationCheckWebhook);
			}

			const userId = ps.method === 'email' ? ps.userId : null;
			const systemWebhookId = ps.method === 'webhook' ? ps.systemWebhookId : null;
			const result = await this.abuseReportNotificationService.updateRecipient(
				{
					id: ps.id,
					isActive: ps.isActive,
					name: ps.name,
					method: ps.method,
					userId: userId ?? null,
					systemWebhookId: systemWebhookId ?? null,
				},
				me,
			);

			return this.abuseReportNotificationRecipientEntityService.pack(result);
		});
	}
}
