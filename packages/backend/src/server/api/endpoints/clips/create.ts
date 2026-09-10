/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { MiClip } from '@/models/_.js';
import { ClipEntityService } from '@/core/entities/ClipEntityService.js';
import { ApiError } from '@/server/api/error.js';
import { ClipService } from '@/core/ClipService.js';
import { packedClipSchema } from '@/models/schema/clip.js';

export const meta = {
	tags: ['clips'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:account',

	res: packedClipSchema,

	errors: {
		tooManyClips: {
			message: 'You cannot create clip any more.',
			code: 'TOO_MANY_CLIPS',
			id: '920f7c2d-6208-4b76-8082-e632020f5883',
		},
	},
} as const;

export const paramDef = v.object({
	name: v.pipe(v.string(), mi.minCodePoints(1), mi.maxCodePoints(100)),
	isPublic: v.optional(v.boolean(), false),
	description: v.optional(v.nullable(v.pipe(v.string(), mi.maxCodePoints(2048)))),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private clipEntityService: ClipEntityService,
		private clipService: ClipService,
	) {
		super(meta, paramDef, async (ps, me) => {
			let clip: MiClip;
			try {
				// 空文字列をnullにしたいので??は使わない
				// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
				clip = await this.clipService.create(me, ps.name, ps.isPublic, ps.description || null);
			} catch (e) {
				if (e instanceof ClipService.TooManyClipsError) {
					throw new ApiError(meta.errors.tooManyClips);
				}
				throw e;
			}
			return await this.clipEntityService.pack(clip, me);
		});
	}
}
