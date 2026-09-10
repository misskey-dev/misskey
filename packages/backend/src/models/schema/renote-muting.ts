/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { packedUserDetailedNotMeSchema } from '@/models/schema/user.js';

export const packedRenoteMutingSchema = v.object({
	id: mi.example(mi.idString(), 'xxxxxxxxxx'),
	createdAt: mi.dateTimeString(),
	muteeId: mi.idString(),
	mutee: packedUserDetailedNotMeSchema,
});
mi.defineEntity('RenoteMuting', packedRenoteMutingSchema);

export type PackedRenoteMuting = v.InferOutput<typeof packedRenoteMutingSchema>;
