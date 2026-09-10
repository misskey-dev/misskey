/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
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

	res: packedSystemWebhookSchema,
} as const;

export const paramDef = v.object({
	isActive: v.boolean(),
	name: v.pipe(v.string(), mi.minCodePoints(1), mi.maxCodePoints(255)),
	on: v.array(v.picklist([...systemWebhookEventTypes])),
	url: v.pipe(v.string(), mi.minCodePoints(1), mi.maxCodePoints(1024)),
	secret: v.optional(v.pipe(v.string(), mi.maxCodePoints(1024)), ''),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private systemWebhookService: SystemWebhookService,
		private systemWebhookEntityService: SystemWebhookEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const result = await this.systemWebhookService.createSystemWebhook(
				{
					isActive: ps.isActive,
					name: ps.name,
					on: ps.on,
					url: ps.url,
					secret: ps.secret,
				},
				me,
			);

			return this.systemWebhookEntityService.pack(result);
		});
	}
}
