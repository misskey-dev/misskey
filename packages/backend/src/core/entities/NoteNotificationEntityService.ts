/*
 * SPDX-FileCopyrightText: yukineko and tai-cat
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';

import type { NoteNotificationsRepository } from '@/models/_.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/json-schema.js';
import type { } from '@/models/Blocking.js';
import type { MiUser } from '@/models/User.js';
import type { MiNoteNotification } from '@/models/NoteNotification.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class NoteNotificationEntityService {
	constructor(
		@Inject(DI.noteNotificationsRepository)
		private noteNotificationsRepository: NoteNotificationsRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async pack(
		src: MiNoteNotification['id'] | MiNoteNotification,
		me?: { id: MiUser['id'] } | null | undefined,
	): Promise<Packed<'NoteNotification'>> {
		const target = typeof src === 'object' ? src : await this.noteNotificationsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: target.id,
			createdAt: this.idService.parse(target.id).date.toISOString(),
			userId: target.targetUserId,
			user: this.userEntityService.pack(target.targetUserId, me, { schema: 'UserDetailed' }),
		});
	}

	@bindThis
	public packMany(
		targets: any[],
		me: { id: MiUser['id'] },
	) {
		return Promise.all(targets.map(x => this.pack(x, me)));
	}
}
