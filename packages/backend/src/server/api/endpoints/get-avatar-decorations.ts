/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IsNull } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { AvatarDecorationService } from '@/core/AvatarDecorationService.js';
import { RoleService } from '@/core/RoleService.js';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	res: v.array(v.object({
		id: mi.example(mi.idString(), 'xxxxxxxxxx'),
		name: v.string(),
		description: v.string(),
		url: v.string(),
		roleIdsThatCanBeUsedThisDecoration: v.array(mi.idString()),
		category: v.nullish(v.string()),
	})),
} as const;

export const paramDef = v.object({});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private avatarDecorationService: AvatarDecorationService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const decorations = await this.avatarDecorationService.getAll(true);
			const allRoles = await this.roleService.getRoles();

			return decorations.map(decoration => ({
				id: decoration.id,
				name: decoration.name,
				description: decoration.description,
				url: decoration.url,
				roleIdsThatCanBeUsedThisDecoration: decoration.roleIdsThatCanBeUsedThisDecoration.filter(roleId => allRoles.some(role => role.id === roleId)),
				category: decoration.category,
			}));
		});
	}
}
