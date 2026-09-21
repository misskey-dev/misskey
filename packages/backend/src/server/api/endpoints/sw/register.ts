/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { IdService } from '@/core/IdService.js';
import type { MiMeta, SwSubscriptionsRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { PushNotificationService } from '@/core/PushNotificationService.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,
	secure: true,

	description: 'Register to receive push notifications.',

	res: v.object({
		state: v.optional(v.picklist(['already-subscribed', 'subscribed'])),
		key: v.nullable(v.string()),
		userId: v.string(),
		endpoint: v.string(),
		sendReadMessage: v.boolean(),
	}),
} as const;

export const paramDef = v.object({
	endpoint: v.string(),
	auth: v.string(),
	publickey: v.string(),
	sendReadMessage: v.optional(v.boolean(), false),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.meta)
		private serverSettings: MiMeta,

		@Inject(DI.swSubscriptionsRepository)
		private swSubscriptionsRepository: SwSubscriptionsRepository,

		private idService: IdService,
		private pushNotificationService: PushNotificationService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// if already subscribed
			const exist = await this.swSubscriptionsRepository.findOneBy({
				userId: me.id,
				endpoint: ps.endpoint,
				auth: ps.auth,
				publickey: ps.publickey,
			});

			if (exist != null) {
				return {
					state: 'already-subscribed' as const,
					key: this.serverSettings.swPublicKey,
					userId: me.id,
					endpoint: exist.endpoint,
					sendReadMessage: exist.sendReadMessage,
				};
			}

			await this.swSubscriptionsRepository.insert({
				id: this.idService.gen(),
				userId: me.id,
				endpoint: ps.endpoint,
				auth: ps.auth,
				publickey: ps.publickey,
				sendReadMessage: ps.sendReadMessage,
			});

			this.pushNotificationService.refreshCache(me.id);

			return {
				state: 'subscribed' as const,
				key: this.serverSettings.swPublicKey,
				userId: me.id,
				endpoint: ps.endpoint,
				sendReadMessage: ps.sendReadMessage,
			};
		});
	}
}
