/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import { AvatarDecorationService } from '@/core/AvatarDecorationService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requiredRolePolicy: 'canManageAvatarDecorations',
	kind: 'read:admin:avatar-decorations',

	res: v.array(v.object({
		id: mi.example(mi.idString(), 'xxxxxxxxxx'),
		createdAt: mi.dateTimeString(),
		updatedAt: v.nullable(mi.dateTimeString()),
		name: v.string(),
		description: v.string(),
		url: v.string(),
		roleIdsThatCanBeUsedThisDecoration: v.array(mi.idString()),
		category: v.nullish(v.string()),
	})),
} as const;

export const paramDef = v.object({
	...mi.paginationEntries({ max: 100, default: 10 }),
	...mi.paginationDateEntries(),
	userId: v.nullish(mi.misskeyId()),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private avatarDecorationService: AvatarDecorationService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const avatarDecorations = await this.avatarDecorationService.getAll(true);

			return avatarDecorations.map(avatarDecoration => ({
				id: avatarDecoration.id,
				createdAt: this.idService.parse(avatarDecoration.id).date.toISOString(),
				updatedAt: avatarDecoration.updatedAt?.toISOString() ?? null,
				name: avatarDecoration.name,
				description: avatarDecoration.description,
				url: avatarDecoration.url,
				roleIdsThatCanBeUsedThisDecoration: avatarDecoration.roleIdsThatCanBeUsedThisDecoration,
				category: avatarDecoration.category,
			}));
		});
	}
}
