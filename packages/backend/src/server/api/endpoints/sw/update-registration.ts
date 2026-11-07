/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { SwSubscriptionsRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { PushNotificationService } from '@/core/PushNotificationService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,
	secure: true,

	description: 'Update push notification registration.',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			userId: {
				type: 'string',
				optional: false, nullable: false,
			},
			endpoint: {
				type: 'string',
				optional: false, nullable: false,
			},
			sendReadMessage: {
				type: 'boolean',
				optional: false, nullable: false,
			},
		},
	},
	errors: {
		noSuchRegistration: {
			message: 'No such registration.',
			code: 'NO_SUCH_REGISTRATION',
			id: ' b09d8066-8064-5613-efb6-0e963b21d012',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		endpoint: { type: 'string' },
		sendReadMessage: { type: 'boolean' },
	},
	required: ['endpoint'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.swSubscriptionsRepository)
		private swSubscriptionsRepository: SwSubscriptionsRepository,

		private pushNotificationService: PushNotificationService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const swSubscription = await this.swSubscriptionsRepository.findOneBy({
				userId: me.id,
				endpoint: ps.endpoint,
			});

			if (swSubscription === null) {
				throw new ApiError(meta.errors.noSuchRegistration);
			}

			if (ps.sendReadMessage !== undefined) {
				swSubscription.sendReadMessage = ps.sendReadMessage;
			}

			await this.swSubscriptionsRepository.update(swSubscription.id, {
				sendReadMessage: swSubscription.sendReadMessage,
			});

			this.pushNotificationService.refreshCache(me.id);

			return {
				userId: swSubscription.userId,
				endpoint: swSubscription.endpoint,
				sendReadMessage: swSubscription.sendReadMessage,
			};
		});
	}
}
