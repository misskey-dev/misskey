/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { ModerationLogsRepository } from '@/models/_.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { MiUser } from '@/models/User.js';
import type { MiModerationLog } from '@/models/ModerationLog.js';
import { bindThis } from '@/decorators.js';
import { Packed } from '@/misc/json-schema.js';
import { IdService } from '@/core/IdService.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class ModerationLogEntityService {
	constructor(
		@Inject(DI.moderationLogsRepository)
		private moderationLogsRepository: ModerationLogsRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async pack(
		src: MiModerationLog['id'] | MiModerationLog,
		me: { id: MiUser['id'] } | null | undefined,
	) : Promise<Packed<'ModerationLog'>> {
		const log = typeof src === 'object' ? src : await this.moderationLogsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: log.id,
			createdAt: this.idService.parse(log.id).date.toISOString(),
			type: log.type,
			info: log.info,
			userId: log.userId,
			user: this.userEntityService.pack(log.user ?? log.userId, me, {
				schema: 'UserDetailed',
			}),
		});
	}

	@bindThis
	public async packMany(
		reports: (MiModerationLog['id'] | MiModerationLog)[],
		me: { id: MiUser['id'] } | null | undefined,
	) : Promise<Packed<'ModerationLog'>[]> {
		return (await Promise.allSettled(reports.map(x => this.pack(x, me))))
			.filter(result => result.status === 'fulfilled')
			.map(result => (result as PromiseFulfilledResult<Packed<'ModerationLog'>>).value);
	}
}

