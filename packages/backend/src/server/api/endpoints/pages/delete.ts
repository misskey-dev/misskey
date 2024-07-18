/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { PagesRepository, UsersRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { RoleService } from '@/core/RoleService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['pages'],

	requireCredential: true,

	kind: 'write:pages',

	errors: {
		noSuchPage: {
			message: 'No such page.',
			code: 'NO_SUCH_PAGE',
			id: 'eb0c6e1d-d519-4764-9486-52a7e1c6392a',
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '8b741b3e-2c22-44b3-a15f-29949aa1601e',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		pageId: { type: 'string', format: 'misskey:id' },
	},
	required: ['pageId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private moderationLogService: ModerationLogService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const page = await this.pagesRepository.findOneBy({ id: ps.pageId });

			if (page == null) {
				throw new ApiError(meta.errors.noSuchPage);
			}

			if (!await this.roleService.isModerator(me) && page.userId !== me.id) {
				throw new ApiError(meta.errors.accessDenied);
			}

			await this.pagesRepository.delete(page.id);

			if (page.userId !== me.id) {
				const user = await this.usersRepository.findOneByOrFail({ id: page.userId });
				this.moderationLogService.log(me, 'deletePage', {
					pageId: page.id,
					pageUserId: page.userId,
					pageUserUsername: user.username,
					page,
				});
			}
		});
	}
}
