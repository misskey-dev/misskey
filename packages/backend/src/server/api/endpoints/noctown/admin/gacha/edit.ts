/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { NoctownGachasRepository, NoctownGachaItemsRepository, NoctownItemsRepository } from '@/models/_.js';
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
			id: 'g1a2c3h4-edit-0001-0001-000000000001',
		},
		gachaNotFound: {
			message: 'Gacha not found.',
			code: 'GACHA_NOT_FOUND',
			id: 'g1a2c3h4-edit-0001-0001-000000000002',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		gachaId: {
			type: 'string',
		},
		name: {
			type: 'string',
			minLength: 1,
			maxLength: 128,
		},
		description: {
			type: 'string',
			maxLength: 1000,
			nullable: true,
		},
		costPerPull: {
			type: 'integer',
			minimum: 0,
		},
		isActive: {
			type: 'boolean',
		},
		positionX: {
			type: 'number',
			nullable: true,
		},
		positionZ: {
			type: 'number',
			nullable: true,
		},
		startDate: {
			type: 'string',
			format: 'date-time',
			nullable: true,
		},
		endDate: {
			type: 'string',
			format: 'date-time',
			nullable: true,
		},
		maxPullsPerPlayer: {
			type: 'integer',
			minimum: 1,
			nullable: true,
		},
		gachaType: {
			type: 'string',
			enum: ['standard', 'limited', 'premium'],
		},
	},
	required: ['gachaId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownGachasRepository)
		private gachasRepository: NoctownGachasRepository,

		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Check permission (moderator or admin)
			const isModerator = await this.roleService.isModerator(me);
			const isAdmin = await this.roleService.isAdministrator(me);

			if (!isModerator && !isAdmin) {
				throw new ApiError(meta.errors.noPermission);
			}

			// Find gacha
			const gacha = await this.gachasRepository.findOneBy({ id: ps.gachaId });
			if (!gacha) {
				throw new ApiError(meta.errors.gachaNotFound);
			}

			// Build update object with provided fields only
			const updateData: Partial<typeof gacha> = {};

			if (ps.name !== undefined) updateData.name = ps.name;
			if (ps.description !== undefined) updateData.description = ps.description;
			if (ps.costPerPull !== undefined) updateData.costPerPull = ps.costPerPull;
			if (ps.isActive !== undefined) updateData.isActive = ps.isActive;
			if (ps.positionX !== undefined) updateData.positionX = ps.positionX;
			if (ps.positionZ !== undefined) updateData.positionZ = ps.positionZ;
			if (ps.startDate !== undefined) updateData.startDate = ps.startDate ? new Date(ps.startDate) : null;
			if (ps.endDate !== undefined) updateData.endDate = ps.endDate ? new Date(ps.endDate) : null;
			if (ps.maxPullsPerPlayer !== undefined) updateData.maxPullsPerPlayer = ps.maxPullsPerPlayer;
			if (ps.gachaType !== undefined) updateData.gachaType = ps.gachaType;

			// Update gacha
			await this.gachasRepository.update({ id: ps.gachaId }, updateData);

			return {
				success: true,
			};
		});
	}
}
