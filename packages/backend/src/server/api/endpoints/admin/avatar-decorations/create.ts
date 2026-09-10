/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { AvatarDecorationService } from '@/core/AvatarDecorationService.js';
import { IdService } from '@/core/IdService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requiredRolePolicy: 'canManageAvatarDecorations',
	kind: 'write:admin:avatar-decorations',

	res: v.object({
		id: mi.idString(),
		createdAt: mi.dateTimeString(),
		updatedAt: v.nullable(mi.dateTimeString()),
		name: v.string(),
		description: v.string(),
		url: v.string(),
		roleIdsThatCanBeUsedThisDecoration: v.array(mi.idString()),
		category: v.nullable(v.string()),
	}),
} as const;

export const paramDef = v.object({
	name: v.pipe(v.string(), mi.minCodePoints(1)),
	description: v.string(),
	url: v.pipe(v.string(), mi.minCodePoints(1)),
	roleIdsThatCanBeUsedThisDecoration: v.optional(v.array(v.string())),
	category: v.nullish(v.string()),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private avatarDecorationService: AvatarDecorationService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const created = await this.avatarDecorationService.create({
				name: ps.name,
				description: ps.description,
				url: ps.url,
				roleIdsThatCanBeUsedThisDecoration: ps.roleIdsThatCanBeUsedThisDecoration,
				category: ps.category,
			}, me);

			return {
				id: created.id,
				createdAt: this.idService.parse(created.id).date.toISOString(),
				updatedAt: null,
				name: created.name,
				description: created.description,
				url: created.url,
				roleIdsThatCanBeUsedThisDecoration: created.roleIdsThatCanBeUsedThisDecoration,
				category: created.category,
			};
		});
	}
}
