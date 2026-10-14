/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AccessTokensRepository } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { NotificationService } from '@/core/NotificationService.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['auth'],

	requireCredential: true,

	secure: true,

	res: v.object({
		token: v.string(),
	}),
} as const;

export const paramDef = v.object({
	session: v.nullable(v.string()),
	name: v.optional(v.nullable(v.string())),
	description: v.optional(v.nullable(v.string())),
	iconUrl: v.optional(v.nullable(v.string())),
	permission: v.pipe(v.array(v.string()), mi.uniqueArray()),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,

		private idService: IdService,
		private notificationService: NotificationService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Generate access token
			const accessToken = secureRndstr(32);

			const now = new Date();

			// Insert access token doc
			await this.accessTokensRepository.insert({
				id: this.idService.gen(now.getTime()),
				lastUsedAt: now,
				session: ps.session,
				userId: me.id,
				token: accessToken,
				hash: accessToken,
				name: ps.name,
				description: ps.description,
				iconUrl: ps.iconUrl,
				permission: ps.permission,
			});

			// アクセストークンが生成されたことを通知
			this.notificationService.createNotification(me.id, 'createToken', {});

			return {
				token: accessToken,
			};
		});
	}
}
