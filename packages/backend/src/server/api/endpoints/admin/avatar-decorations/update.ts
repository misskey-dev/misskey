/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { AvatarDecorationService } from '@/core/AvatarDecorationService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	errors: {
		sameNameAvatarDecorationExists: {
			message: 'Avatar Decoration that have same name already exists.',
			code: 'SAME_NAME_AVATAR_DECORATION_EXISTS',
			id: '745f81d4-edf0-4b0c-ae6a-0f7b4c114c4c',
		},
		noSuchAvatarDecoration: {
			message: 'No such avatar decoration.',
			code: 'NO_SUCH_AVATAR_DECORATION',
			id: '8de45b2b-0c59-4181-8ee1-fd582d2b13c5',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		id: { type: 'string', format: 'misskey:id' },
		name: { type: 'string', minLength: 1 },
		description: { type: 'string' },
		url: { type: 'string', minLength: 1 },
		roleIdsThatCanBeUsedThisDecoration: { type: 'array', items: {
			type: 'string',
		} },
	},
	required: ['id', 'name'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private avatarDecorationService: AvatarDecorationService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const avatarDecoration = await this.avatarDecorationService.getAvatarDecorationById(ps.id);

			if (avatarDecoration != null) {
				if (ps.name !== avatarDecoration.name) {
					const isDuplicate = await this.avatarDecorationService.checkDuplicate(ps.name);
					if (isDuplicate) throw new ApiError(meta.errors.sameNameAvatarDecorationExists);
				}
			} else {
				throw new ApiError(meta.errors.noSuchAvatarDecoration);
			}

			await this.avatarDecorationService.update(ps.id, {
				name: ps.name,
				description: ps.description,
				url: ps.url,
				roleIdsThatCanBeUsedThisDecoration: ps.roleIdsThatCanBeUsedThisDecoration,
			}, me);
		});
	}
}
