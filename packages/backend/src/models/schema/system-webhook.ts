/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { systemWebhookEventTypes } from '@/models/SystemWebhook.js';

export const packedSystemWebhookSchema = v.object({
	id: v.string(),
	isActive: v.boolean(),
	updatedAt: mi.dateTimeString(),
	latestSentAt: v.nullable(mi.dateTimeString()),
	latestStatus: v.nullable(v.number()),
	name: v.string(),
	on: v.array(v.picklist([...systemWebhookEventTypes])),
	url: v.string(),
	secret: v.string(),
});
mi.defineEntity('SystemWebhook', packedSystemWebhookSchema);

export type PackedSystemWebhook = v.InferOutput<typeof packedSystemWebhookSchema>;
