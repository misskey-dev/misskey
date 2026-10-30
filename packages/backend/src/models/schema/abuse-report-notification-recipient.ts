/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { packedUserLiteSchema } from '@/models/schema/user.js';
import { packedSystemWebhookSchema } from '@/models/schema/system-webhook.js';

export const packedAbuseReportNotificationRecipientSchema = v.object({
	id: v.string(),
	isActive: v.boolean(),
	updatedAt: mi.dateTimeString(),
	name: v.string(),
	method: v.picklist(['email', 'webhook']),
	userId: v.optional(v.string()),
	user: v.optional(packedUserLiteSchema),
	systemWebhookId: v.optional(v.string()),
	systemWebhook: v.optional(packedSystemWebhookSchema),
});
mi.defineEntity('AbuseReportNotificationRecipient', packedAbuseReportNotificationRecipientSchema);

export type PackedAbuseReportNotificationRecipient = v.InferOutput<typeof packedAbuseReportNotificationRecipientSchema>;
