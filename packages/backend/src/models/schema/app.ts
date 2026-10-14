/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';

export const packedAppSchema = v.object({
	id: v.string(),
	name: v.string(),
	callbackUrl: v.nullable(v.string()),
	permission: v.array(v.string()),
	secret: v.optional(v.string()),
	isAuthorized: v.optional(v.boolean()),
});
mi.defineEntity('App', packedAppSchema);

export type PackedApp = v.InferOutput<typeof packedAppSchema>;
