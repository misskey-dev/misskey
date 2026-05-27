/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { WorldAvatarService } from '@/core/WorldAvatarService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['worldAvatar'],

	requireCredential: true,

	kind: 'write:worldAvatar',

	res: {
	},

	errors: {
		noSuchAvatar: {
			message: 'No such avatar.',
			code: 'NO_SUCH_ROOM',
			id: 'fcdb0f92-bda6-47f9-bd05-343e0e020933',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		avatarId: { type: 'string', format: 'misskey:id' },
		name: { type: 'string', maxLength: 256 },
		def: { type: 'object', additionalProperties: true },
		active: { type: 'boolean' },
	},
	required: ['avatarId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private worldAvatarService: WorldAvatarService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const avatar = await this.worldAvatarService.findMyAvatarById(me.id, ps.avatarId);
			if (avatar == null) {
				throw new ApiError(meta.errors.noSuchAvatar);
			}

			// TODO: validate avatar

			await this.worldAvatarService.update(avatar, {
				name: ps.name,
				def: ps.def,
				active: ps.active,
			});
		});
	}
}
