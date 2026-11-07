/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { ModerationLogsRepository } from '@/models/_.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { } from '@/models/Blocking.js';
import { MiModerationLog } from '@/models/ModerationLog.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import type { Packed } from '@/misc/json-schema.js';
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
		hint?: {
			packedUser?: Packed<'UserDetailedNotMe'>,
		},
	) {
		const log = typeof src === 'object' ? src : await this.moderationLogsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: log.id,
			createdAt: this.idService.parse(log.id).date.toISOString(),
			type: log.type,
			info: log.info,
			userId: log.userId,
			user: hint?.packedUser ?? this.userEntityService.pack(log.user ?? log.userId, null, {
				schema: 'UserDetailedNotMe',
			}),
		});
	}

	@bindThis
	public async packMany(
		reports: MiModerationLog[],
	) {
		const _users = reports.map(({ user, userId }) => user ?? userId);
		const _userMap = await this.userEntityService.packMany(_users, null, { schema: 'UserDetailedNotMe' })
			.then(users => new Map(users.map(u => [u.id, u])));
		return Promise.all(reports.map(report => this.pack(report, { packedUser: _userMap.get(report.userId) })));
	}
}

