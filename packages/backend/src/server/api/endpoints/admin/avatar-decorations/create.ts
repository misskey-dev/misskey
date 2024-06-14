/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { AvatarDecorationService } from '@/core/AvatarDecorationService.js';
import { DriveService } from '@/core/DriveService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireRolePolicy: 'canManageAvatarDecorations',
	kind: 'write:admin:avatar-decorations',
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string', minLength: 1 },
		description: { type: 'string' },
		url: { type: 'string', minLength: 1 },
		roleIdsThatCanBeUsedThisDecoration: { type: 'array', items: {
			type: 'string',
		} },
	},
	required: ['name', 'description', 'url'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private avatarDecorationService: AvatarDecorationService,
		private driveService: DriveService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// システムユーザーとして再アップロード
			const sysFileData = await this.driveService.uploadFromUrl({
				url: ps.url,
				user: null,
				force: true,
			});
			await this.avatarDecorationService.create({
				name: ps.name,
				description: ps.description,
				url: sysFileData.url,
				roleIdsThatCanBeUsedThisDecoration: ps.roleIdsThatCanBeUsedThisDecoration,
			}, me);
		});
	}
}
