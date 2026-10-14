/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { SystemWebhookEntityService } from '@/core/entities/SystemWebhookEntityService.js';
import { systemWebhookEventTypes } from '@/models/SystemWebhook.js';
import { SystemWebhookService } from '@/core/SystemWebhookService.js';
import { packedSystemWebhookSchema } from '@/models/schema/system-webhook.js';

export const meta = {
	tags: ['admin', 'system-webhook'],

	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'write:admin:system-webhook',

	res: v.array(packedSystemWebhookSchema),
} as const;

export const paramDef = v.object({
	isActive: v.optional(v.boolean()),
	on: v.optional(v.array(v.picklist([...systemWebhookEventTypes]))),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private systemWebhookService: SystemWebhookService,
		private systemWebhookEntityService: SystemWebhookEntityService,
	) {
		super(meta, paramDef, async (ps) => {
			const webhooks = await this.systemWebhookService.fetchSystemWebhooks({
				isActive: ps.isActive,
				on: ps.on,
			});
			return this.systemWebhookEntityService.packMany(webhooks);
		});
	}
}
