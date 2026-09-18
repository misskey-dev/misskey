/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { packedUserDetailedNotMeSchema } from '@/models/schema/user.js';

export const packedBlockingSchema = v.object({
	id: mi.example(mi.idString(), 'xxxxxxxxxx'),
	createdAt: mi.dateTimeString(),
	blockeeId: mi.idString(),
	blockee: packedUserDetailedNotMeSchema,
});
mi.defineEntity('Blocking', packedBlockingSchema);

export type PackedBlocking = v.InferOutput<typeof packedBlockingSchema>;
