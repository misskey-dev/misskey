/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { ModerationLogsRepository } from '@/models/index.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { MiUser } from '@/models/entities/User.js';
import type { MiModerationLog } from '@/models/entities/ModerationLog.js';
import { bindThis } from '@/decorators.js';
import { Packed } from '@/misc/json-schema.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class ModerationLogEntityService {
	constructor(
		@Inject(DI.moderationLogsRepository)
		private moderationLogsRepository: ModerationLogsRepository,

		private userEntityService: UserEntityService,
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
			createdAt: log.createdAt.toISOString(),
			type: log.type,
			info: log.info,
			userId: log.userId,
			user: this.userEntityService.pack(log.user ?? log.userId, me, {
				detail: true,
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

