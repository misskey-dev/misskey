/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type { MiUser } from '@/models/User.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import { UserKeypairService } from './UserKeypairService.js';
import { ApDeliverManagerService } from './activitypub/ApDeliverManagerService.js';

@Injectable()
export class UserSuspendService {
	constructor(
		private userEntityService: UserEntityService,
		private globalEventService: GlobalEventService,
		private apRendererService: ApRendererService,
		private userKeypairService: UserKeypairService,
		private apDeliverManagerService: ApDeliverManagerService,
	) {
	}

	@bindThis
	public async doPostSuspend(user: { id: MiUser['id']; host: MiUser['host'] }): Promise<void> {
		this.globalEventService.publishInternalEvent('userChangeSuspendedState', { id: user.id, isSuspended: true });

		if (this.userEntityService.isLocalUser(user)) {
			const content = this.apRendererService.addContext(this.apRendererService.renderDelete(this.userEntityService.genLocalUserUri(user.id), user));
			const manager = this.apDeliverManagerService.createDeliverManager(user, content);
			manager.addAllKnowingSharedInboxRecipe();
			// process deliver時にはキーペアが消去されているはずなので、ここで挿入する
			const privateKey = await this.userKeypairService.getLocalUserPrivateKeyPem(user.id, 'main');
			manager.execute({ privateKey });
		}
	}

	@bindThis
	public async doPostUnsuspend(user: MiUser): Promise<void> {
		this.globalEventService.publishInternalEvent('userChangeSuspendedState', { id: user.id, isSuspended: false });

		if (this.userEntityService.isLocalUser(user)) {
			const content = this.apRendererService.addContext(this.apRendererService.renderUndo(this.apRendererService.renderDelete(this.userEntityService.genLocalUserUri(user.id), user), user));
			const manager = this.apDeliverManagerService.createDeliverManager(user, content);
			manager.addAllKnowingSharedInboxRecipe();
			// process deliver時にはキーペアが消去されているはずなので、ここで挿入する
			const privateKey = await this.userKeypairService.getLocalUserPrivateKeyPem(user.id, 'main');
			manager.execute({ privateKey });
		}
	}
}
