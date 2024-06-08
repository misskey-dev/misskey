/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { FollowingsRepository } from '@/models/_.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { DI } from '@/di-symbols.js';
import { GetterService } from '@/server/api/GetterService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['following', 'users'],

	limit: {
		duration: ms('1hour'),
		max: 10,
	},

	requireCredential: true,

	kind: 'write:following',
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		notify: { type: 'string', enum: ['normal', 'none'] },
		withReplies: { type: 'boolean' },
	},
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			await this.followingsRepository.update({
				followerId: me.id,
			}, {
				notify: ps.notify != null ? (ps.notify === 'none' ? null : ps.notify) : undefined,
				withReplies: ps.withReplies != null ? ps.withReplies : undefined,
			});

			return;
		});
	}
}
