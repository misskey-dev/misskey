/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import type Logger from '@/logger.js';
import type { UsersRepository } from '@/models/_.js';
import type { MiUser } from '@/models/User.js';
import { RoleService } from '@/core/RoleService.js';
import { QueueService } from '@/core/QueueService.js';
import { UserSuspendService } from '@/core/UserSuspendService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { LoggerService } from '@/core/LoggerService.js';

@Injectable()
export class DeleteAccountService {
	public logger: Logger;

	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private roleService: RoleService,
		private queueService: QueueService,
		private userSuspendService: UserSuspendService,
		private globalEventService: GlobalEventService,
		private loggerService: LoggerService,
	) {
		this.logger = this.loggerService.getLogger('account:delete');
	}

	@bindThis
	public async deleteAccount(user: MiUser, soft: boolean, me: MiUser | null): Promise<void> {
		this.logger.warn(`Delete account requested by ${me ? me.id : 'remote'} for ${user.id} (soft: ${soft})`);

		const _user = await this.usersRepository.findOneByOrFail({ id: user.id });
		if (_user.isRoot) throw new Error('cannot delete a root account');

		// 5分間の間に同じアカウントに対して削除リクエストが複数回来た場合、最初のリクエストのみを処理する
		const lock = await this.redisClient.set(`account:delete:lock:${user.id}`, Date.now(), 'EX', 60 * 5, 'NX');
		if (lock === null) {
			this.logger.warn(`Delete account is already in progress for ${user.id}`);
			return;
		}

		// noinspection ES6MissingAwait APIで呼び出される際にタイムアウトされないように
		(async () => {
			try {
				// 物理削除する前にDelete activityを送信する
				await this.userSuspendService.doPostSuspend(user).catch(err => this.logger.error(err));

				// noinspection ES6MissingAwait
				this.queueService.createDeleteAccountJob(user, {
					force: me ? await this.roleService.isModerator(me) : false,
					soft: soft,
				});

				await this.usersRepository.update(user.id, {
					isDeleted: true,
				});

				this.globalEventService.publishInternalEvent('userChangeDeletedState', { id: user.id, isDeleted: true });
			} catch (err) {
				this.logger.error(`Failed to delete account ${user.id}, request by ${me ? me.id : 'remote'} (soft: ${soft})`, { error: err });
				// すでにcallstackから離れてるので、ここでエラーをthrowしても意味がない
			} finally {
				// 成功・失敗に関わらずロックを解除
				await this.redisClient.unlink(`account:delete:lock:${user.id}`);
			}
		})();
	}

	@bindThis
	public async deleteAllDriveFiles(user: MiUser, me: MiUser | null): Promise<void> {
		this.logger.warn(`Delete all drive files requested by ${me ? me.id : 'remote'} for ${user.id}`);

		await this.usersRepository.findOneByOrFail({ id: user.id });

		this.queueService.createDeleteAccountJob(user, {
			force: me ? await this.roleService.isModerator(me) : false,
			onlyFiles: true,
		});
	}
}
