/*
 * SPDX-FileCopyrightText: anatawa12
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { MiMeta, MiNote, MiUser, UsersRepository } from '@/models/_.js';
import { bindThis } from '@/decorators.js';

type MinimumUser = {
	id: MiUser['id'];
	host: MiUser['host'];
	username: MiUser['username'];
	uri: MiUser['uri'];
};

type AuthorUser = {
	id: MiUser['id'];
	username: MiUser['username'];
	host: MiUser['host'];
};

@Injectable()
export class SpamFilterService {
	constructor(
		@Inject(DI.meta)
		private meta: MiMeta,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
	) {
	}

	@bindThis
	public async isSpam(
		{
			mentionedUsers,
			visibility,
			visibleUsers,
			reply,
			quote,
			user,
		}: {
			mentionedUsers: readonly MinimumUser[],
			visibility: MiNote['visibility'] | string,
			visibleUsers: readonly MinimumUser[],
			reply: MiNote | null,
			quote: MiNote | null,
			// null if new remote user
			user: AuthorUser | null,
		},
	) {
		// spam filter is enabled
		if (!this.meta.nirilaBlockMentionsFromUnfamiliarRemoteUsers) return false;
		// do not check for local user
		if (user != null && user.host === null) return false;

		const willCauseNotification = mentionedUsers.some(u => u.host === null)
			|| (visibility === 'specified' && visibleUsers.some(u => u.host === null))
			|| reply?.userHost === null || (quote != null && quote.userHost === null) || false;

		// if no notification is created, it's not a harmful spam
		if (!willCauseNotification) return false;

		// get list of users that will create notification
		const targetUserIds: string[] = [
			...mentionedUsers.filter(x => x.host == null).map(x => x.id),
			...(visibility === 'specified' ? visibleUsers.filter(x => x.host == null).map(x => x.id) : []),
			...(reply != null && reply.userHost == null ? [reply.userId] : []),
			...(quote != null && quote.userHost === null ? [quote.userId] : []),
		];

		// if notification is created only for allowed users, it's not a spam or harmful
		const allowedIds = new Set(this.meta.nirilaAllowedUnfamiliarRemoteUserIds);
		if (targetUserIds.every(id => allowedIds.has(id))) return false;

		// if someone follows the user, it's not a spam
		if (await this.hasFollower(user)) return false;

		// all conditions are met, it's a spam
		return true;
	}

	private async hasFollower(user: AuthorUser | null): Promise<boolean> {
		// the user is new user so no one follows the user
		if (user == null) return false;

		// if the user looks like MiUser, check followersCount
		if ('followersCount' in user && typeof user.followersCount === 'number') {
			return user.followersCount > 0;
		}

		const userEntity = await this.usersRepository.findOneBy({ id: user.id });
		// user not found
		if (userEntity == null) return false;

		return userEntity.followersCount > 0;
	}
}
