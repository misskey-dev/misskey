/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { MiUser } from '@/models/User.js';
import type { UserProfilesRepository, UsersRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { CacheService } from '@/core/CacheService.js';

export const meta = {
	tags: ['admin'],
	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:meta', // TODO: Probably make a new permission for this
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,
		private driveFileEntityService: DriveFileEntityService,
		private cacheService: CacheService,
		
	) {
		super(meta, paramDef, async (ps, me) => {
			// TODO: Paginate it at 100 000 000 users xD
			const users = await this.usersRepository.find({
				select: {
					id: true,
				},
			});

			for (const item of users) {
				const user = await this.usersRepository.findOne({
					where: {
						id: item.id,
					},
					relations: {
						avatar: true,
						banner: true,
					},
				});

				if (!user) continue;

				const updates: Partial<MiUser> = {};
				if (user.avatar) {
					updates.avatarUrl = this.driveFileEntityService.getPublicUrl(user.avatar, 'avatar');
					updates.avatarBlurhash = user.avatar.blurhash;
				}
				if (user.bannerId && user.banner) {
					updates.bannerUrl = this.driveFileEntityService.getPublicUrl(user.banner);
					updates.bannerBlurhash = user.banner.blurhash;
				}
				
				if (Object.keys(updates).length === 0) continue;

				const result = await this.usersRepository.update(user.id, updates);
				
				// Double check and fail if it's bad
				if (result.affected === 0) throw new Error('Failed to update user');

				const updatedProfile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });
				this.cacheService.userProfileCache.set(user.id, updatedProfile);
			}
		});
	}
}
