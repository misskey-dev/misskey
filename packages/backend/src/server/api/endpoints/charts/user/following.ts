/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { UserProfilesRepository } from '@/models/_.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { RoleService } from '@/core/RoleService.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { getJsonSchema } from '@/core/chart/core.js';
import PerUserFollowingChart from '@/core/chart/charts/per-user-following.js';
import { schema } from '@/core/chart/charts/entities/per-user-following.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['charts', 'users', 'following'],

	res: getJsonSchema(schema),

	errors: {
		ffIsMarkedAsPrivate: {
			message: 'This user\'s followings and/or followers is marked as private.',
			code: 'FF_IS_MARKED_AS_PRIVATE',
			id: 'f9c54d7f-d4c2-4d3c-9a8g-a70daac86512',
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
		private userEntityService: UserEntityService,
		private perUserFollowingChart: PerUserFollowingChart,
	) {
		super(meta, paramDef, async (ps, me) => {
			const done = async () => {
				return await this.perUserFollowingChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null, ps.userId);
			};

			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: ps.userId });

			if (profile.followingVisibility === 'public' && profile.followersVisibility === 'public') {
				done();
			}

			if (me != null && me.id === ps.userId) {
				done();
			}

			const iAmModerator = await this.roleService.isModerator(me);

			if (iAmModerator) {
				done();
			}

			if (
				me != null && (
					(profile.followingVisibility === 'followers' && profile.followersVisibility === 'followers') ||
					(profile.followingVisibility === 'followers' && profile.followersVisibility === 'public') ||
					(profile.followingVisibility === 'public' && profile.followersVisibility === 'followers')
				)
			) {
				const relations = await this.userEntityService.getRelation(me.id, ps.userId);
				if (relations.following) {
					done();
				}
			}

			throw new ApiError(meta.errors.ffIsMarkedAsPrivate);
		});
	}
}
