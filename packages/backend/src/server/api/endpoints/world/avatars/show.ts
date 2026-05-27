/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { WorldAvatarService } from '@/core/WorldAvatarService.js';
import { ApiError } from '@/server/api/error.js';
import { WorldAvatarEntityService } from '@/core/entities/WorldAvatarEntityService.js';

export const meta = {
	tags: ['worldAvatar'],

	requireCredential: true,

	kind: 'read:worldAvatar',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'WorldAvatarDetailed',
	},

	errors: {
		noSuchAvatar: {
			message: 'No such avatar.',
			code: 'NO_SUCH_ROOM',
			id: '857ae02f-8759-4d20-9adb-6e95fffe4fd8',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		avatarId: { type: 'string', format: 'misskey:id' },
	},
	required: ['avatarId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private worldAvatarService: WorldAvatarService,
		private worldAvatarEntityService: WorldAvatarEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const avatar = await this.worldAvatarService.findAvatarById(ps.avatarId);
			if (avatar == null) {
				throw new ApiError(meta.errors.noSuchAvatar);
			}

			if (avatar.userId !== me.id) {
				throw new ApiError(meta.errors.noSuchAvatar);
			}

			return this.worldAvatarEntityService.packDetailed(avatar, me);
		});
	}
}
