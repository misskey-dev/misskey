/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IsNull } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository, PagesRepository, FollowingsRepository } from '@/models/_.js';
import type { MiPage } from '@/models/Page.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { PageEntityService } from '@/core/entities/PageEntityService.js';
import { RoleService } from '@/core/RoleService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['pages'],

	requireCredential: false,

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Page',
	},

	errors: {
		noSuchPage: {
			message: 'No such page.',
			code: 'NO_SUCH_PAGE',
			id: '222120c0-3ead-4528-811b-b96f233388d7',
		},
		accessDenied: {
			message: 'You do not have permission to view this page.',
			code: 'ACCESS_DENIED',
			id: 'c5a3a9e2-4b7d-4f1e-8a9c-2d6e3f7b8c1a',
		},
	},
} as const;

export const paramDef = {
	anyOf: [
		{
			type: 'object',
			properties: {
				pageId: { type: 'string', format: 'misskey:id' },
			},
			required: ['pageId'],
		},
		{
			type: 'object',
			properties: {
				name: { type: 'string' },
				username: { type: 'string' },
			},
			required: ['name', 'username'],
		},
	],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private pageEntityService: PageEntityService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			let page: MiPage | null = null;

			if ('pageId' in ps) {
				page = await this.pagesRepository.findOneBy({ id: ps.pageId });
			} else {
				const author = await this.usersRepository.findOneBy({
					host: IsNull(),
					usernameLower: ps.username.toLowerCase(),
				});
				if (author) {
					page = await this.pagesRepository.findOneBy({
						name: ps.name,
						userId: author.id,
					});
				}
			}

			if (page == null) {
				throw new ApiError(meta.errors.noSuchPage);
			}

			// 権限チェック: public / url-only は誰でも閲覧可能
			if (page.visibility === 'specified') {
				if (me == null) {
					throw new ApiError(meta.errors.accessDenied);
				}
				if (me.id !== page.userId && !await this.roleService.isModerator(me)) {
					if (!page.visibleUserIds.includes(me.id)) {
						throw new ApiError(meta.errors.accessDenied);
					}
				}
			} else if (page.visibility === 'followers') {
				if (me == null) {
					throw new ApiError(meta.errors.accessDenied);
				}
				if (me.id !== page.userId && !await this.roleService.isModerator(me)) {
					const isFollowing = await this.followingsRepository.exists({
						where: {
							followerId: me.id,
							followeeId: page.userId,
						},
					});
					if (!isFollowing) {
						throw new ApiError(meta.errors.accessDenied);
					}
				}
			}

			return await this.pageEntityService.pack(page, me);
		});
	}
}
