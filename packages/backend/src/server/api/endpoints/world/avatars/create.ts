/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';
import { WorldAvatarService } from '@/core/WorldAvatarService.js';
import { WorldAvatarEntityService } from '@/core/entities/WorldAvatarEntityService.js';

export const meta = {
	tags: ['worldAvatar'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:worldAvatar',

	limit: {
		duration: ms('1day'),
		max: 10,
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'WorldAvatarDetailed',
	},

	errors: {
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string', maxLength: 256 },
		def: { type: 'object', additionalProperties: true },
	},
	required: ['name', 'def'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private worldAvatarService: WorldAvatarService,
		private worldAvatarEntityService: WorldAvatarEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// TODO: validate avatar

			const avatar = await this.worldAvatarService.create(me, {
				name: ps.name,
				def: ps.def,
			});
			return await this.worldAvatarEntityService.packDetailed(avatar);
		});
	}
}
