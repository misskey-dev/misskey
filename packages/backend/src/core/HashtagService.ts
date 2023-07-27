/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { User } from '@/models/entities/User.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { IdService } from '@/core/IdService.js';
import type { Hashtag } from '@/models/entities/Hashtag.js';
import type { HashtagsRepository, UsersRepository } from '@/models/index.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class HashtagService {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.hashtagsRepository)
		private hashtagsRepository: HashtagsRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async updateHashtags(user: { id: User['id']; host: User['host']; }, tags: string[]) {
		for (const tag of tags) {
			await this.updateHashtag(user, tag);
		}
	}

	@bindThis
	public async updateUsertags(user: User, tags: string[]) {
		for (const tag of tags) {
			await this.updateHashtag(user, tag, true, true);
		}

		for (const tag of (user.tags ?? []).filter(x => !tags.includes(x))) {
			await this.updateHashtag(user, tag, true, false);
		}
	}

	@bindThis
	public async updateHashtag(user: { id: User['id']; host: User['host']; }, tag: string, isUserAttached = false, inc = true) {
		tag = normalizeForSearch(tag);

		const index = await this.hashtagsRepository.findOneBy({ name: tag });

		if (index == null && !inc) return;

		if (index != null) {
			const q = this.hashtagsRepository.createQueryBuilder('tag').update()
				.where('name = :name', { name: tag });

			const set = {} as any;

			if (isUserAttached) {
				if (inc) {
				// 自分が初めてこのタグを使ったなら
					if (!index.attachedUserIds.some(id => id === user.id)) {
						set.attachedUserIds = () => `array_append("attachedUserIds", '${user.id}')`;
						set.attachedUsersCount = () => '"attachedUsersCount" + 1';
					}
					// 自分が(ローカル内で)初めてこのタグを使ったなら
					if (this.userEntityService.isLocalUser(user) && !index.attachedLocalUserIds.some(id => id === user.id)) {
						set.attachedLocalUserIds = () => `array_append("attachedLocalUserIds", '${user.id}')`;
						set.attachedLocalUsersCount = () => '"attachedLocalUsersCount" + 1';
					}
					// 自分が(リモートで)初めてこのタグを使ったなら
					if (this.userEntityService.isRemoteUser(user) && !index.attachedRemoteUserIds.some(id => id === user.id)) {
						set.attachedRemoteUserIds = () => `array_append("attachedRemoteUserIds", '${user.id}')`;
						set.attachedRemoteUsersCount = () => '"attachedRemoteUsersCount" + 1';
					}
				} else {
					set.attachedUserIds = () => `array_remove("attachedUserIds", '${user.id}')`;
					set.attachedUsersCount = () => '"attachedUsersCount" - 1';
					if (this.userEntityService.isLocalUser(user)) {
						set.attachedLocalUserIds = () => `array_remove("attachedLocalUserIds", '${user.id}')`;
						set.attachedLocalUsersCount = () => '"attachedLocalUsersCount" - 1';
					} else {
						set.attachedRemoteUserIds = () => `array_remove("attachedRemoteUserIds", '${user.id}')`;
						set.attachedRemoteUsersCount = () => '"attachedRemoteUsersCount" - 1';
					}
				}
			} else {
			// 自分が初めてこのタグを使ったなら
				if (!index.mentionedUserIds.some(id => id === user.id)) {
					set.mentionedUserIds = () => `array_append("mentionedUserIds", '${user.id}')`;
					set.mentionedUsersCount = () => '"mentionedUsersCount" + 1';
				}
				// 自分が(ローカル内で)初めてこのタグを使ったなら
				if (this.userEntityService.isLocalUser(user) && !index.mentionedLocalUserIds.some(id => id === user.id)) {
					set.mentionedLocalUserIds = () => `array_append("mentionedLocalUserIds", '${user.id}')`;
					set.mentionedLocalUsersCount = () => '"mentionedLocalUsersCount" + 1';
				}
				// 自分が(リモートで)初めてこのタグを使ったなら
				if (this.userEntityService.isRemoteUser(user) && !index.mentionedRemoteUserIds.some(id => id === user.id)) {
					set.mentionedRemoteUserIds = () => `array_append("mentionedRemoteUserIds", '${user.id}')`;
					set.mentionedRemoteUsersCount = () => '"mentionedRemoteUsersCount" + 1';
				}
			}

			if (Object.keys(set).length > 0) {
				q.set(set);
				q.execute();
			}
		} else {
			if (isUserAttached) {
				this.hashtagsRepository.insert({
					id: this.idService.genId(),
					name: tag,
					mentionedUserIds: [],
					mentionedUsersCount: 0,
					mentionedLocalUserIds: [],
					mentionedLocalUsersCount: 0,
					mentionedRemoteUserIds: [],
					mentionedRemoteUsersCount: 0,
					attachedUserIds: [user.id],
					attachedUsersCount: 1,
					attachedLocalUserIds: this.userEntityService.isLocalUser(user) ? [user.id] : [],
					attachedLocalUsersCount: this.userEntityService.isLocalUser(user) ? 1 : 0,
					attachedRemoteUserIds: this.userEntityService.isRemoteUser(user) ? [user.id] : [],
					attachedRemoteUsersCount: this.userEntityService.isRemoteUser(user) ? 1 : 0,
				} as Hashtag);
			} else {
				this.hashtagsRepository.insert({
					id: this.idService.genId(),
					name: tag,
					mentionedUserIds: [user.id],
					mentionedUsersCount: 1,
					mentionedLocalUserIds: this.userEntityService.isLocalUser(user) ? [user.id] : [],
					mentionedLocalUsersCount: this.userEntityService.isLocalUser(user) ? 1 : 0,
					mentionedRemoteUserIds: this.userEntityService.isRemoteUser(user) ? [user.id] : [],
					mentionedRemoteUsersCount: this.userEntityService.isRemoteUser(user) ? 1 : 0,
					attachedUserIds: [],
					attachedUsersCount: 0,
					attachedLocalUserIds: [],
					attachedLocalUsersCount: 0,
					attachedRemoteUserIds: [],
					attachedRemoteUsersCount: 0,
				} as Hashtag);
			}
		}
	}
}
