/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { MiMeta, MiUser, UsersRepository } from '@/models/_.js';
import { QueueService } from '@/core/QueueService.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { ApDeliverManagerService } from '@/core/activitypub/ApDeliverManagerService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { SystemAccountService } from '@/core/SystemAccountService.js';

@Injectable()
export class DeleteAccountService {
	constructor(
		@Inject(DI.meta)
		private meta: MiMeta,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private userEntityService: UserEntityService,
		private apRendererService: ApRendererService,
		private apDeliverManagerService: ApDeliverManagerService,
		private queueService: QueueService,
		private globalEventService: GlobalEventService,
		private moderationLogService: ModerationLogService,
		private systemAccountService: SystemAccountService,
	) {
	}

	@bindThis
	public async deleteAccount(user: {
		id: string;
		host: string | null;
	}, moderator?: MiUser): Promise<void> {
		if (this.meta.rootUserId === user.id) throw new Error('cannot delete a root account');

		const _user = await this.usersRepository.findOneByOrFail({ id: user.id });

		if (user.host === null && _user.username.includes('.')) {
			throw new Error('cannot delete a system account');
		}

		if (moderator != null) {
			this.moderationLogService.log(moderator, 'deleteAccount', {
				userId: user.id,
				userUsername: _user.username,
				userHost: user.host,
			});
		}

		// 物理削除する前にDelete activityを送信する
		if (this.userEntityService.isLocalUser(user)) {
			// 知り得る全SharedInboxにDelete配信
			const content = this.apRendererService.addContext(this.apRendererService.renderDelete(this.userEntityService.genLocalUserUri(user.id), user));

			await this.apDeliverManagerService.deliverToAllKnownSharedInboxes(user, content);

			this.queueService.createDeleteAccountJob(user, {
				soft: false,
			});
		} else {
			// リモートユーザーの削除は、完全にDBから物理削除してしまうと再度連合してきてアカウントが復活する可能性があるため、soft指定する
			this.queueService.createDeleteAccountJob(user, {
				soft: true,
			});
		}

		await this.usersRepository.update(user.id, {
			isDeleted: true,
		});

		this.globalEventService.publishInternalEvent('userChangeDeletedState', { id: user.id, isDeleted: true });
	}
}
