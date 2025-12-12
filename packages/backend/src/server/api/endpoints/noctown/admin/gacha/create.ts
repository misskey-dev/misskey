/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { NoctownGachasRepository } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
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
			id: { type: 'string' },
			name: { type: 'string' },
		},
	},

	errors: {
		noPermission: {
			message: 'No permission.',
			code: 'NO_PERMISSION',
			id: 'g1a2c3h4-crea-0001-0001-000000000001',
		},
		gachaAlreadyExists: {
			message: 'Gacha with this name already exists.',
			code: 'GACHA_ALREADY_EXISTS',
			id: 'g1a2c3h4-crea-0001-0001-000000000002',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
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
			default: 100,
		},
		isActive: {
			type: 'boolean',
			default: true,
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
			default: 'standard',
		},
	},
	required: ['name'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownGachasRepository)
		private gachasRepository: NoctownGachasRepository,

		private idService: IdService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Check permission (moderator or admin)
			const isModerator = await this.roleService.isModerator(me);
			const isAdmin = await this.roleService.isAdministrator(me);

			if (!isModerator && !isAdmin) {
				throw new ApiError(meta.errors.noPermission);
			}

			// Check if gacha with same name exists
			const existing = await this.gachasRepository.findOneBy({ name: ps.name });
			if (existing) {
				throw new ApiError(meta.errors.gachaAlreadyExists);
			}

			// Create gacha
			const gachaId = this.idService.gen();

			await this.gachasRepository.insert({
				id: gachaId,
				name: ps.name,
				description: ps.description ?? null,
				costPerPull: ps.costPerPull ?? 100,
				isActive: ps.isActive ?? true,
				positionX: ps.positionX ?? null,
				positionZ: ps.positionZ ?? null,
				startDate: ps.startDate ? new Date(ps.startDate) : null,
				endDate: ps.endDate ? new Date(ps.endDate) : null,
				maxPullsPerPlayer: ps.maxPullsPerPlayer ?? null,
				gachaType: ps.gachaType ?? 'standard',
			});

			return {
				id: gachaId,
				name: ps.name,
			};
		});
	}
}
