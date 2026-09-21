/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { webhookEventTypes } from '@/models/Webhook.js';

export const packedUserWebhookSchema = v.object({
	id: mi.idString(),
	userId: mi.idString(),
	name: v.string(),
	on: v.array(v.picklist([...webhookEventTypes])),
	url: v.string(),
	secret: v.string(),
	active: v.boolean(),
	latestSentAt: v.nullable(mi.dateTimeString()),
	latestStatus: v.nullable(mi.integer()),
});
mi.defineEntity('UserWebhook', packedUserWebhookSchema);

export type PackedUserWebhook = v.InferOutput<typeof packedUserWebhookSchema>;
