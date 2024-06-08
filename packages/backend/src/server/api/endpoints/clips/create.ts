/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { MiClip } from '@/models/_.js';
import { ClipEntityService } from '@/core/entities/ClipEntityService.js';
import { ApiError } from '@/server/api/error.js';
import { ClipService } from '@/core/ClipService.js';

export const meta = {
	tags: ['clips'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Clip',
	},

	errors: {
		tooManyClips: {
			message: 'You cannot create clip any more.',
			code: 'TOO_MANY_CLIPS',
			id: '920f7c2d-6208-4b76-8082-e632020f5883',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string', minLength: 1, maxLength: 100 },
		isPublic: { type: 'boolean', default: false },
		description: { type: 'string', nullable: true, minLength: 1, maxLength: 2048 },
	},
	required: ['name'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private clipEntityService: ClipEntityService,
		private clipService: ClipService,
	) {
		super(meta, paramDef, async (ps, me) => {
			let clip: MiClip;
			try {
				clip = await this.clipService.create(me, ps.name, ps.isPublic, ps.description ?? null);
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
