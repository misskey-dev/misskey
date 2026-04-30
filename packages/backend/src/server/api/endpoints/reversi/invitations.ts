/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { RoleService } from '@/core/RoleService.js';
import { ReversiService } from '@/core/ReversiService.js';
import { asyncFilter } from '@/misc/prelude/array.js';

export const meta = {
	requireCredential: true,
	requireRolePolicy: 'canPlayGames',

	kind: 'read:account',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: { ref: 'UserLite' },
	},
} as const;

export const paramDef = {
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private userEntityService: UserEntityService,
		private roleService: RoleService,
		private reversiService: ReversiService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const invitations = await asyncFilter(await this.reversiService.getInvitations(me), async (userId) => {
				const policies = await this.roleService.getUserPolicies(userId);
				return policies.canPlayGames;
			});

			return await this.userEntityService.packMany(invitations, me);
		});
	}
}
