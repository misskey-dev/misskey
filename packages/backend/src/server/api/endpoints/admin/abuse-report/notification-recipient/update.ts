/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import {
	AbuseReportNotificationRecipientEntityService,
} from '@/core/entities/AbuseReportNotificationRecipientEntityService.js';
import { AbuseReportNotificationService } from '@/core/AbuseReportNotificationService.js';
import { isNotNull } from '@/misc/is-not-null.js';
import { DI } from '@/di-symbols.js';
import type { UserProfilesRepository } from '@/models/_.js';

export const meta = {
	tags: ['admin', 'abuse-report', 'notification-recipient'],

	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'write:admin:abuse-report:notification-recipient',

	res: {
		type: 'array',
		items: {
			type: 'object',
			ref: 'AbuseReportNotificationRecipient',
		},
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
		items: {
			type: 'array',
			items: {
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
			},
		},
	},
	required: ['items'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,
		private abuseReportNotificationService: AbuseReportNotificationService,
		private abuseReportNotificationRecipientEntityService: AbuseReportNotificationRecipientEntityService,
	) {
		super(meta, paramDef, async (ps) => {
			const userIds = ps.items.map(it => it.userId).filter(isNotNull);
			const userProfiles = await this.userProfilesRepository.findBy({ userId: In(userIds) })
				.then(it => new Map(it.map(it => [it.userId, it])));

			for (const recipient of ps.items) {
				if (recipient.method === 'email') {
					if (!recipient.userId) {
						throw new ApiError(meta.errors.correlationCheckEmail);
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const userProfile = userProfiles.get(recipient.userId)!;
					if (!userProfile.email || !userProfile.emailVerified) {
						throw new ApiError(meta.errors.emailAddressNotSet);
					}
				}

				if (recipient.method === 'webhook' && !recipient.systemWebhookId) {
					throw new ApiError(meta.errors.correlationCheckWebhook);
				}
			}

			const result = await this.abuseReportNotificationService.updateRecipients(
				ps.items.map(it => {
					const userId = it.method === 'email' ? it.userId : null;
					const systemWebhookId = it.method === 'webhook' ? it.systemWebhookId : null;

					return {
						id: it.id,
						isActive: it.isActive,
						name: it.name,
						method: it.method,
						userId: userId ?? null,
						systemWebhookId: systemWebhookId ?? null,
					};
				}),
			);

			return this.abuseReportNotificationRecipientEntityService.packMany(result);
		});
	}
}
