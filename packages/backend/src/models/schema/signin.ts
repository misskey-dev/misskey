/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';

export const packedSigninSchema = v.object({
	id: v.string(),
	createdAt: mi.dateTimeString(),
	ip: v.string(),
	headers: mi.anyObject(),
	success: v.boolean(),
});
mi.defineEntity('Signin', packedSigninSchema);

export type PackedSignin = v.InferOutput<typeof packedSigninSchema>;
