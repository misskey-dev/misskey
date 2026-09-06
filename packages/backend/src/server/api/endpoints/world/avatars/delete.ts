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

	errors: {
		noSuchAvatar: {
			message: 'No such avatar.',
			code: 'NO_SUCH_ROOM',
			id: 'd4e3753d-97bf-4a19-ab8e-21080fbc0f4c',
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
	) {
		super(meta, paramDef, async (ps, me) => {
			const avatar = await this.worldAvatarService.findMyAvatarById(me.id, ps.avatarId);
			if (avatar == null) {
				throw new ApiError(meta.errors.noSuchAvatar);
			}

			await this.worldAvatarService.delete(avatar, me);
		});
	}
}
