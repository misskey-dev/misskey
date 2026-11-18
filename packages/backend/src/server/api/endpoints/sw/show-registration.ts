/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { SwSubscriptionsRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,
	kind: 'write:push-subscriptions',

	description: 'Check push notification registration exists.',

	res: {
		type: 'object',
		optional: false, nullable: true,
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
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		endpoint: { type: 'string' },
	},
	required: ['endpoint'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.swSubscriptionsRepository)
		private swSubscriptionsRepository: SwSubscriptionsRepository,
	) {
		super(meta, paramDef, async (ps, me, token) => {
			// if already subscribed
			const exist = await this.swSubscriptionsRepository.findOneBy({
				userId: me.id,
				endpoint: ps.endpoint,
				// アクセストークン経由の場合は、そのトークンで登録した購読のみを対象とする
				...(token != null ? { accessTokenId: token.id } : {}),
			});

			if (exist != null) {
				return {
					userId: exist.userId,
					endpoint: exist.endpoint,
					sendReadMessage: exist.sendReadMessage,
				};
			}

			return null;
		});
	}
}
