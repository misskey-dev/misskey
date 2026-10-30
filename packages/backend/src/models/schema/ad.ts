/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';

export const packedAdSchema = v.object({
	id: mi.example(mi.idString(), 'xxxxxxxxxx'),
	expiresAt: mi.dateTimeString(),
	startsAt: mi.dateTimeString(),
	place: v.string(),
	priority: v.string(),
	ratio: v.number(),
	url: v.string(),
	imageUrl: v.string(),
	memo: v.string(),
	dayOfWeek: mi.integer(),
	isSensitive: v.boolean(),
});
mi.defineEntity('Ad', packedAdSchema);

export type PackedAd = v.InferOutput<typeof packedAdSchema>;
