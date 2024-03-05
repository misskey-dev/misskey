/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { UsersRepository } from '@/models/_.js';
import type { MiUser } from '@/models/User.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { RelayService } from '@/core/RelayService.js';
import { ApDeliverManagerService } from '@/core/activitypub/ApDeliverManagerService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import type { PrivateKey } from './activitypub/type.js';

@Injectable()
export class AccountUpdateService implements OnModuleInit {
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

	async onModuleInit() {
		this.apDeliverManagerService = this.moduleRef.get(ApDeliverManagerService.name);
	}

	@bindThis
	/**
	 * ユーザーのアップデートをフォロワーに配信する
	 * @param userId ユーザーID
	 * @param isKeyUpdation Ed25519キーの作成など公開鍵のアップデートによる呼び出しか？ trueにするとメインキーを使うようになる
	 */
	public async publishToFollowers(userId: MiUser['id'], deliverKey?: PrivateKey) {
		const user = await this.usersRepository.findOneBy({ id: userId });
		if (user == null) throw new Error('user not found');

		// フォロワーがリモートユーザーかつ投稿者がローカルユーザーならUpdateを配信
		if (this.userEntityService.isLocalUser(user)) {
			const content = this.apRendererService.addContext(this.apRendererService.renderUpdate(await this.apRendererService.renderPerson(user), user));
			await Promise.allSettled([
				this.apDeliverManagerService.deliverToFollowers(user, content, deliverKey),
				this.relayService.deliverToRelays(user, content, deliverKey),
			]);
		}
	}
}
