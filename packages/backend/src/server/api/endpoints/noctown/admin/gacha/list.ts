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
	kind: 'read:admin:noctown',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			properties: {
				id: { type: 'string' },
				name: { type: 'string' },
				description: { type: 'string', nullable: true },
				costPerPull: { type: 'number' },
				isActive: { type: 'boolean' },
				positionX: { type: 'number', nullable: true },
				positionZ: { type: 'number', nullable: true },
				startDate: { type: 'string', nullable: true },
				endDate: { type: 'string', nullable: true },
				maxPullsPerPlayer: { type: 'number', nullable: true },
				gachaType: { type: 'string' },
				itemCount: { type: 'number' },
				createdAt: { type: 'string' },
			},
		},
	},

	errors: {
		noPermission: {
			message: 'No permission.',
			code: 'NO_PERMISSION',
			id: 'g1a2c3h4-list-0001-0001-000000000001',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: {
			type: 'integer',
			minimum: 1,
			maximum: 100,
			default: 50,
		},
		offset: {
			type: 'integer',
			minimum: 0,
			default: 0,
		},
		includeInactive: {
			type: 'boolean',
			default: true,
		},
	},
	required: [],
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

			// Build query
			const query = this.gachasRepository.createQueryBuilder('gacha');

			if (!ps.includeInactive) {
				query.where('gacha.isActive = :isActive', { isActive: true });
			}

			query
				.orderBy('gacha.createdAt', 'DESC')
				.take(ps.limit ?? 50)
				.skip(ps.offset ?? 0);

			const gachas = await query.getMany();

			// Get item counts for each gacha
			const result = await Promise.all(gachas.map(async (gacha) => {
				const itemCount = await this.gachaItemsRepository.countBy({ gachaId: gacha.id });

				return {
					id: gacha.id,
					name: gacha.name,
					description: gacha.description,
					costPerPull: gacha.costPerPull,
					isActive: gacha.isActive,
					positionX: gacha.positionX,
					positionZ: gacha.positionZ,
					startDate: gacha.startDate?.toISOString() ?? null,
					endDate: gacha.endDate?.toISOString() ?? null,
					maxPullsPerPlayer: gacha.maxPullsPerPlayer,
					gachaType: gacha.gachaType,
					itemCount,
					createdAt: gacha.createdAt.toISOString(),
				};
			}));

			return result;
		});
	}
}
