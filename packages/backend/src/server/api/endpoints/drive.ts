/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { MetaService } from '@/core/MetaService.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { RoleService } from '@/core/RoleService.js';

export const meta = {
	tags: ['drive', 'account'],

	requireCredential: true,

	kind: 'read:drive',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			capacity: {
				type: 'number',
				optional: false, nullable: false,
			},
			usage: {
				type: 'number',
				optional: false, nullable: false,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private metaService: MetaService,
		private driveFileEntityService: DriveFileEntityService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const instance = await this.metaService.fetch(true);

			// Calculate drive usage
			const usage = await this.driveFileEntityService.calcDriveUsageOf(me.id);

			const policies = await this.roleService.getUserPolicies(me.id);

			return {
				capacity: 1024 * 1024 * policies.driveCapacityMb,
				usage: usage,
			};
		});
	}
}
