/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { IdService } from '@/core/IdService.js';
import type { MiMeta, SwSubscriptionsRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { PushNotificationService } from '@/core/PushNotificationService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,
	kind: 'write:push-subscriptions',

	description: 'Register to receive push notifications. When called with an access token, the token must also have the `read:notifications` permission. Only the push messages that the token is permitted to read are delivered (e.g. chat messages require `read:chat`), and the registration is removed when the token is revoked.',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			state: {
				type: 'string',
				optional: true, nullable: false,
				enum: ['already-subscribed', 'subscribed'],
			},
			key: {
				type: 'string',
				optional: false, nullable: true,
			},
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
		invalidEndpoint: {
			message: 'Invalid push endpoint.',
			code: 'INVALID_ENDPOINT',
			id: '4432adbe-17c0-4f9f-b43c-9ceb2f8910fe',
		},

		readNotificationsPermissionRequired: {
			message: 'The access token must also have the read:notifications permission to receive push notifications.',
			code: 'READ_NOTIFICATIONS_PERMISSION_REQUIRED',
			kind: 'permission',
			id: '5ca35223-1863-4408-9cb0-40f79ab213c2',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		endpoint: { type: 'string' },
		auth: { type: 'string' },
		publickey: { type: 'string' },
		sendReadMessage: { type: 'boolean', default: false },
	},
	required: ['endpoint', 'auth', 'publickey'],
} as const;

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
		super(meta, paramDef, async (ps, me, token) => {
			// 通知を読む権限の無いトークンでは何も受け取れないため登録させない
			if (token != null && !token.permission.includes('read:notifications')) {
				throw new ApiError(meta.errors.readNotificationsPermissionRequired);
			}

			if (!this.pushNotificationService.isValidEndpoint(ps.endpoint)) {
				throw new ApiError(meta.errors.invalidEndpoint);
			}

			// if already subscribed
			const exist = await this.swSubscriptionsRepository.findOneBy({
				userId: me.id,
				endpoint: ps.endpoint,
				auth: ps.auth,
				publickey: ps.publickey,
			});

			if (exist != null) {
				// 別のアクセストークンで再登録された場合は、紐づけ先を現在のトークンに付け替える
				// (ネイティブトークンでの再登録では既存の紐づけを維持する)
				if (token != null && exist.accessTokenId !== token.id) {
					await this.swSubscriptionsRepository.update(exist.id, { accessTokenId: token.id });
					this.pushNotificationService.refreshCache(me.id);
				}

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
				// ネイティブトークン (ログイントークン) で登録された場合は null
				accessTokenId: token?.id ?? null,
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
