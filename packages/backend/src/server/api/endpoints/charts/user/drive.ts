/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { UserProfilesRepository } from '@/models/_.js';
import { getJsonSchema } from '@/core/chart/core.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import PerUserDriveChart from '@/core/chart/charts/per-user-drive.js';
import { schema } from '@/core/chart/charts/entities/per-user-drive.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['charts', 'drive', 'users'],

	res: getJsonSchema(schema),

	allowGet: true,
	cacheSec: 60 * 60,

	errors: {
		activityNotPublic: {
			message: 'Activity of the user is not public.',
			code: 'ACTIVITY_NOT_PUBLIC',
			id: '28e59b25-7eaf-4ff4-bac5-251fd7d8449b',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		span: { type: 'string', enum: ['day', 'hour'] },
		limit: { type: 'integer', minimum: 1, maximum: 500, default: 30 },
		offset: { type: 'integer', nullable: true, default: null },
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['span', 'userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private roleService: RoleService,
		private perUserDriveChart: PerUserDriveChart,
	) {
		super(meta, paramDef, async (ps, me) => {
			const iAmModerator = me ? await this.roleService.isModerator(me) : false; // Moderators can see activity of all users
			if (!iAmModerator) {
				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: ps.userId });
				if ((me == null || me.id !== ps.userId) && profile.hideActivity) {
					throw new ApiError(meta.errors.activityNotPublic);
				}
			}

			return await this.perUserDriveChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null, ps.userId);
		});
	}
}
