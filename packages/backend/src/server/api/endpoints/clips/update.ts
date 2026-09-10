/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ClipEntityService } from '@/core/entities/ClipEntityService.js';
import { ClipService } from '@/core/ClipService.js';
import { packedClipSchema } from '@/models/schema/clip.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['clips'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:account',

	errors: {
		noSuchClip: {
			message: 'No such clip.',
			code: 'NO_SUCH_CLIP',
			id: 'b4d92d70-b216-46fa-9a3f-a8c811699257',
		},
	},

	res: packedClipSchema,
} as const;

export const paramDef = v.object({
	clipId: mi.misskeyId(),
	name: v.optional(v.pipe(v.string(), mi.minCodePoints(1), mi.maxCodePoints(100))),
	isPublic: v.optional(v.boolean()),
	description: v.optional(v.nullable(v.pipe(v.string(), mi.maxCodePoints(2048)))),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private clipService: ClipService,

		private clipEntityService: ClipEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			try {
				// 空文字列をnullにしたいので??は使わない
				// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
				await this.clipService.update(me, ps.clipId, ps.name, ps.isPublic, ps.description || null);
			} catch (e) {
				if (e instanceof ClipService.NoSuchClipError) {
					throw new ApiError(meta.errors.noSuchClip);
				}
				throw e;
			}

			return await this.clipEntityService.pack(ps.clipId, me);
		});
	}
}
