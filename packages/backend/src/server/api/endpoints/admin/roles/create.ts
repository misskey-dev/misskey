/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { RoleEntityService } from '@/core/entities/RoleEntityService.js';
import { RoleService } from '@/core/RoleService.js';
import { packedRoleSchema } from '@/models/schema/role.js';

export const meta = {
	tags: ['admin', 'role'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:roles',

	res: packedRoleSchema,
} as const;

export const paramDef = v.object({
	name: v.string(),
	description: v.string(),
	color: v.nullable(v.string()),
	iconUrl: v.nullable(v.string()),
	target: v.picklist(['manual', 'conditional']),
	// legacy 側も `{ type: 'object' }` (properties 無し) の TS 型は any に潰れていた。
	// mi.anyObject() (Record<string, any>) にすると RoleService.create() の
	// Partial<MiRole>.condFormula (RoleCondFormulaValue union) に代入できずコンパイルエラーになるため、
	// 型は legacy と同じ any のまま api.json 上だけ { type: 'object' } に合わせる (cookbook R1 の例外)
	condFormula: v.pipe(v.any(), mi.openApi({ type: 'object' })),
	isPublic: v.boolean(),
	isModerator: v.boolean(),
	isAdministrator: v.boolean(),
	isExplorable: v.optional(v.boolean(), false), // optional for backward compatibility
	asBadge: v.boolean(),
	preserveAssignmentOnMoveAccount: v.optional(v.boolean()),
	canEditMembersByModerator: v.boolean(),
	displayOrder: v.number(),
	policies: mi.anyObject(),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private roleEntityService: RoleEntityService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const created = await this.roleService.create(ps, me);

			return await this.roleEntityService.pack(created, me);
		});
	}
}
