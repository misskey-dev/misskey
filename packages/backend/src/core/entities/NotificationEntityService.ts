import { getRequiredService, IServiceProvider } from 'yohira';
import { Inject, Injectable } from '@/di-decorators.js';
import { DI } from '@/di-symbols.js';
import type { AccessTokensRepository, NoteReactionsRepository, NotificationsRepository, User } from '@/models/index.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Notification } from '@/models/entities/Notification.js';
import type { Note } from '@/models/entities/Note.js';
import type { Packed } from '@/misc/json-schema.js';
import { bindThis } from '@/decorators.js';
import { isNotNull } from '@/misc/is-not-null.js';
import { notificationTypes } from '@/types.js';
import type { CustomEmojiService } from '../CustomEmojiService.js';
import type { UserEntityService } from './UserEntityService.js';
import type { NoteEntityService } from './NoteEntityService.js';

const NOTE_REQUIRED_NOTIFICATION_TYPES = new Set(['mention', 'reply', 'renote', 'quote', 'reaction', 'pollEnded'] as (typeof notificationTypes[number])[]);

@Injectable()
export class NotificationEntityService {
	constructor(
		@Inject(IServiceProvider)
		private serviceProvider: IServiceProvider,

		@Inject(DI.notificationsRepository)
		private notificationsRepository: NotificationsRepository,

		@Inject(DI.noteReactionsRepository)
		private noteReactionsRepository: NoteReactionsRepository,

		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,

		// @Inject(DI.UserEntityService)
		// private userEntityService: UserEntityService,

		// @Inject(DI.NoteEntityService)
		// private noteEntityService: NoteEntityService,

		// @Inject(DI.CustomEmojiService)
		// private customEmojiService: CustomEmojiService,
	) {
	}

	// HACK: for circular dependency
	private get userEntityService(): UserEntityService {
		return getRequiredService(this.serviceProvider, DI.UserEntityService);
	}
	private get noteEntityService(): NoteEntityService {
		return getRequiredService(this.serviceProvider, DI.NoteEntityService);
	}
	private get customEmojiService(): CustomEmojiService {
		return getRequiredService(this.serviceProvider, DI.CustomEmojiService);
	}

	@bindThis
	public async pack(
		src: Notification['id'] | Notification,
		options: {
			_hint_?: {
				packedNotes: Map<Note['id'], Packed<'Note'>>;
			};
		},
	): Promise<Packed<'Notification'>> {
		const notification = typeof src === 'object' ? src : await this.notificationsRepository.findOneByOrFail({ id: src });
		const token = notification.appAccessTokenId ? await this.accessTokensRepository.findOneByOrFail({ id: notification.appAccessTokenId }) : null;
		const noteIfNeed = NOTE_REQUIRED_NOTIFICATION_TYPES.has(notification.type) && notification.noteId != null ? (
			options._hint_?.packedNotes != null
				? options._hint_.packedNotes.get(notification.noteId)
				: this.noteEntityService.pack(notification.note ?? notification.noteId!, { id: notification.notifieeId }, {
					detail: true,
				})
		) : undefined;

		return await awaitAll({
			id: notification.id,
			createdAt: notification.createdAt.toISOString(),
			type: notification.type,
			isRead: notification.isRead,
			userId: notification.notifierId,
			user: notification.notifierId ? this.userEntityService.pack(notification.notifier ?? notification.notifierId) : null,
			...(noteIfNeed != null ? { note: noteIfNeed } : {}),
			...(notification.type === 'reaction' ? {
				reaction: notification.reaction,
			} : {}),
			...(notification.type === 'achievementEarned' ? {
				achievement: notification.achievement,
			} : {}),
			...(notification.type === 'app' ? {
				body: notification.customBody,
				header: notification.customHeader ?? token?.name,
				icon: notification.customIcon ?? token?.iconUrl,
			} : {}),
		});
	}

	/**
	 * @param notifications you should join "note" property when fetch from DB, and all notifieeId should be same as meId
	 */
	@bindThis
	public async packMany(
		notifications: Notification[],
		meId: User['id'],
	) {
		if (notifications.length === 0) return [];
		
		for (const notification of notifications) {
			if (meId !== notification.notifieeId) {
				// because we call note packMany with meId, all notifieeId should be same as meId
				throw new Error('TRY_TO_PACK_ANOTHER_USER_NOTIFICATION');
			}
		}

		const notes = notifications.map(x => x.note).filter(isNotNull);
		const packedNotesArray = await this.noteEntityService.packMany(notes, { id: meId }, {
			detail: true,
		});
		const packedNotes = new Map(packedNotesArray.map(p => [p.id, p]));

		return await Promise.all(notifications.map(x => this.pack(x, {
			_hint_: {
				packedNotes,
			},
		})));
	}
}
