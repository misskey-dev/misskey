import { Inject, Injectable } from '@nestjs/common';
import { DI_SYMBOLS } from '@/di-symbols.js';
import { Users } from '@/models/index.js';
import type { Config } from '@/config/types.js';
import type { User } from '@/models/entities/user.js';
import type { ApRendererService } from '@/services/remote/activitypub/ApRendererService.js';
import type { RelayService } from '@/services/RelayService.js';
import type { ApDeliverManagerService } from '@/services/remote/activitypub/ApDeliverManagerService.js';

@Injectable()
export class AccountUpdateService {
	constructor(
		@Inject(DI_SYMBOLS.config)
		private config: Config,

		@Inject('usersRepository')
		private usersRepository: typeof Users,

		private apRendererService: ApRendererService,
		private apDeliverManagerService: ApDeliverManagerService,
		private relayService: RelayService,
	) {
	}

	public async publishToFollowers(userId: User['id']) {
		const user = await this.usersRepository.findOneBy({ id: userId });
		if (user == null) throw new Error('user not found');
	
		// フォロワーがリモートユーザーかつ投稿者がローカルユーザーならUpdateを配信
		if (Users.isLocalUser(user)) {
			const content = this.apRendererService.renderActivity(this.apRendererService.renderUpdate(await this.apRendererService.renderPerson(user), user));
			this.apDeliverManagerService.deliverToFollowers(user, content);
			this.relayService.deliverToRelays(user, content);
		}
	}
}
