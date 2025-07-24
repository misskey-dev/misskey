/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { UsersRepository } from '@/models/_.js';
import type { MiLocalUser, MiUser } from '@/models/User.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { RelayService } from '@/core/RelayService.js';
import { ApDeliverManagerService } from '@/core/activitypub/ApDeliverManagerService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import type { PrivateKeyWithPem } from '@misskey-dev/node-http-message-signatures';

@Injectable()
export class AccountUpdateService {
	private apDeliverManagerService: ApDeliverManagerService;
	constructor(
		private moduleRef: ModuleRef,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private userEntityService: UserEntityService,
		private apRendererService: ApRendererService,
		private relayService: RelayService,
	) {
	}

	private async createUpdatePersonActivity(user: MiLocalUser) {
		return this.apRendererService.addContext(
			this.apRendererService.renderUpdate(
				await this.apRendererService.renderPerson(user), user
			)
		);
	}

	@bindThis
	/**
	 * Deliver account update to followers
	 * @param userId user id
	 * @param deliverKey optional. Private key to sign the deliver.
	 */
	public async publishToFollowers(userId: MiUser['id'], deliverKey?: PrivateKeyWithPem) {
		const user = await this.usersRepository.findOneBy({ id: userId });
		if (user == null || user.isDeleted) {
			// ユーザーが存在しない、または削除されている場合は何もしない
			return;
		}

		// ローカルユーザーならUpdateを配信
		if (this.userEntityService.isLocalUser(user)) {
			const content = await this.createUpdatePersonActivity(user);
			this.apDeliverManagerService.deliverToFollowers(user, content, deliverKey);
			this.relayService.deliverToRelays(user, content, deliverKey);
		}
	}

	@bindThis
	async publishToFollowersAndSharedInboxAndRelays(userId: MiUser['id']) {
		const user = await this.usersRepository.findOneBy({ id: userId });
		if (user == null || user.isDeleted) {
			// ユーザーが存在しない、または削除されている場合は何もしない
			return;
		}

		// ローカルユーザーならUpdateを配信
		if (this.userEntityService.isLocalUser(user)) {
			const content = await this.createUpdatePersonActivity(user);
			const manager = this.apDeliverManagerService.createDeliverManager(user, content);
			manager.addAllKnowingSharedInboxRecipe();
			manager.addFollowersRecipe();

			await Promise.allSettled([
				manager.execute(),
				this.relayService.deliverToRelays(user, content),
			]);
		}
	}
}
