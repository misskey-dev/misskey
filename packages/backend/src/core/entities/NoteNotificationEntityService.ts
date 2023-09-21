import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { NoteNotificationsRepository } from '@/models/_.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/json-schema.js';
import type { } from '@/models/Blocking.js';
import type { MiUser } from '@/models/User.js';
import type { MiNoteNotification } from '@/models/NoteNotification.js';
import { bindThis } from '@/decorators.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class NoteNotificationEntityService {
	constructor(
		@Inject(DI.noteNotificationsRepository)
		private noteNotificationsRepository: NoteNotificationsRepository,

		private userEntityService: UserEntityService,
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
			createdAt: target.createdAt.toISOString(),
			userId: target.targetUserId,
			user: this.userEntityService.pack(target.targetUserId, me, {
				detail: true,
			}),
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
