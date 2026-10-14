/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RolesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';
import { RoleService } from '@/core/RoleService.js';

export const meta = {
	tags: ['admin', 'role'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:roles',

	errors: {
		noSuchRole: {
			message: 'No such role.',
			code: 'NO_SUCH_ROLE',
			id: 'cd23ef55-09ad-428a-ac61-95a45e124b32',
		},
	},
} as const;

export const paramDef = v.object({
	roleId: mi.misskeyId(),
	name: v.optional(v.string()),
	description: v.optional(v.string()),
	color: v.optional(v.nullable(v.string())),
	iconUrl: v.optional(v.nullable(v.string())),
	target: v.optional(v.picklist(['manual', 'conditional'])),
	// legacy 側も `{ type: 'object' }` (properties 無し) の TS 型は any に潰れていた。
	// mi.anyObject() (Record<string, any>) にすると RoleService.update() の
	// Partial<MiRole>.condFormula (RoleCondFormulaValue union) に代入できずコンパイルエラーになるため、
	// 型は legacy と同じ any のまま api.json 上だけ { type: 'object' } に合わせる (cookbook R1 の例外)
	condFormula: v.optional(v.pipe(v.any(), mi.openApi({ type: 'object' }))),
	isPublic: v.optional(v.boolean()),
	isModerator: v.optional(v.boolean()),
	isAdministrator: v.optional(v.boolean()),
	isExplorable: v.optional(v.boolean()),
	asBadge: v.optional(v.boolean()),
	preserveAssignmentOnMoveAccount: v.optional(v.boolean()),
	canEditMembersByModerator: v.optional(v.boolean()),
	displayOrder: v.optional(v.number()),
	policies: v.optional(mi.anyObject()),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.rolesRepository)
		private rolesRepository: RolesRepository,

		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const role = await this.rolesRepository.findOneBy({ id: ps.roleId });
			if (role == null) {
				throw new ApiError(meta.errors.noSuchRole);
			}

			await this.roleService.update(role, {
				name: ps.name,
				description: ps.description,
				color: ps.color,
				iconUrl: ps.iconUrl,
				target: ps.target,
				condFormula: ps.condFormula,
				isPublic: ps.isPublic,
				isModerator: ps.isModerator,
				isAdministrator: ps.isAdministrator,
				isExplorable: ps.isExplorable,
				asBadge: ps.asBadge,
				preserveAssignmentOnMoveAccount: ps.preserveAssignmentOnMoveAccount,
				canEditMembersByModerator: ps.canEditMembersByModerator,
				displayOrder: ps.displayOrder,
				policies: ps.policies,
			}, me);
		});
	}
}
