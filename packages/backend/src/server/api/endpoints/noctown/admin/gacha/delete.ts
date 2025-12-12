/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { NoctownGachasRepository, NoctownGachaItemsRepository } from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';
import { RoleService } from '@/core/RoleService.js';

export const meta = {
	tags: ['noctown', 'admin'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:noctown',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			success: { type: 'boolean' },
		},
	},

	errors: {
		noPermission: {
			message: 'No permission.',
			code: 'NO_PERMISSION',
			id: 'g1a2c3h4-dele-0001-0001-000000000001',
		},
		gachaNotFound: {
			message: 'Gacha not found.',
			code: 'GACHA_NOT_FOUND',
			id: 'g1a2c3h4-dele-0001-0001-000000000002',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		gachaId: {
			type: 'string',
		},
	},
	required: ['gachaId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownGachasRepository)
		private gachasRepository: NoctownGachasRepository,

		@Inject(DI.noctownGachaItemsRepository)
		private gachaItemsRepository: NoctownGachaItemsRepository,

		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Check permission (moderator or admin)
			const isModerator = await this.roleService.isModerator(me);
			const isAdmin = await this.roleService.isAdministrator(me);

			if (!isModerator && !isAdmin) {
				throw new ApiError(meta.errors.noPermission);
			}

			// Check if gacha exists
			const gacha = await this.gachasRepository.findOneBy({ id: ps.gachaId });
			if (!gacha) {
				throw new ApiError(meta.errors.gachaNotFound);
			}

			// Delete related gacha items first (cascade should handle this, but explicit is safer)
			await this.gachaItemsRepository.delete({ gachaId: ps.gachaId });

			// Delete gacha
			await this.gachasRepository.delete({ id: ps.gachaId });

			return {
				success: true,
			};
		});
	}
}
