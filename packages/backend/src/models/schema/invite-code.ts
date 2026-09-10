/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { packedUserLiteSchema } from '@/models/schema/user.js';

export const packedInviteCodeSchema = v.object({
	id: mi.example(mi.idString(), 'xxxxxxxxxx'),
	code: mi.example(v.string(), 'GR6S02ERUA5VR'),
	expiresAt: v.nullable(mi.dateTimeString()),
	createdAt: mi.dateTimeString(),
	createdBy: v.nullable(packedUserLiteSchema),
	usedBy: v.nullable(packedUserLiteSchema),
	usedAt: v.nullable(mi.dateTimeString()),
	used: v.boolean(),
});
mi.defineEntity('InviteCode', packedInviteCodeSchema);

export type PackedInviteCode = v.InferOutput<typeof packedInviteCodeSchema>;
