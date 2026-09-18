/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { packedUserDetailedNotMeSchema } from '@/models/schema/user.js';

export const packedMutingSchema = v.object({
	id: mi.example(mi.idString(), 'xxxxxxxxxx'),
	createdAt: mi.dateTimeString(),
	expiresAt: v.nullable(mi.dateTimeString()),
	muteeId: mi.idString(),
	mutee: packedUserDetailedNotMeSchema,
});
mi.defineEntity('Muting', packedMutingSchema);

export type PackedMuting = v.InferOutput<typeof packedMutingSchema>;
