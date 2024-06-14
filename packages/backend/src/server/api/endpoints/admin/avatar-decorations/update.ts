/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { AvatarDecorationService } from '@/core/AvatarDecorationService.js';
import { DriveService } from '@/core/DriveService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireRolePolicy: 'canManageAvatarDecorations',
	kind: 'write:admin:avatar-decorations',

	errors: {
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
	required: ['id'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private avatarDecorationService: AvatarDecorationService,
		private driveService: DriveService,
	) {
		super(meta, paramDef, async (ps, me) => {
			let fileUrl = ps.url;
			// URLに変更があるか
			if (typeof ps.url !== 'undefined' || typeof ps.url === 'string' ) {
				// システムユーザーとして再アップロード
				const sysFileData = await this.driveService.uploadFromUrl({
					url: ps.url,
					user: null,
					force: true,
				});
				fileUrl = sysFileData.url;
			}
			await this.avatarDecorationService.update(ps.id, {
				name: ps.name,
				description: ps.description,
				url: fileUrl,
				roleIdsThatCanBeUsedThisDecoration: ps.roleIdsThatCanBeUsedThisDecoration,
			}, me);
		});
	}
}
