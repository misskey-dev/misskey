/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
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
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private roleService: RoleService,
		private queueService: QueueService,
		private userSuspendService: UserSuspendService,
		private globalEventService: GlobalEventService,
		private loggerService: LoggerService,
	) {
		this.logger = this.loggerService.getLogger('delete-account');
	}

	@bindThis
	public async deleteAccount(user: MiUser, soft: boolean, me: MiUser | null): Promise<void> {
		this.logger.warn(`Delete account requested by ${me ? me.id : 'remote'} for ${user.id} (soft: ${soft})`);

		const _user = await this.usersRepository.findOneByOrFail({ id: user.id });
		if (_user.isRoot) throw new Error('cannot delete a root account');

		// 物理削除する前にDelete activityを送信する
		await this.userSuspendService.doPostSuspend(user).catch(err => this.logger.error(err));

		this.queueService.createDeleteAccountJob(user, {
			force: me ? await this.roleService.isModerator(me) : false,
			soft: soft,
		});

		await this.usersRepository.update(user.id, {
			isDeleted: true,
		});

		this.globalEventService.publishInternalEvent('userChangeDeletedState', { id: user.id, isDeleted: true });
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
