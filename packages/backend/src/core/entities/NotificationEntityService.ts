import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { AccessTokensRepository, NoteReactionsRepository, NotificationsRepository } from '@/models/index.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Notification } from '@/models/entities/Notification.js';
import type { NoteReaction } from '@/models/entities/NoteReaction.js';
import type { Note } from '@/models/entities/Note.js';
import type { Packed } from '@/misc/schema.js';
import type { OnModuleInit } from '@nestjs/common';
import type { CustomEmojiService } from '../CustomEmojiService.js';
import type { UserEntityService } from './UserEntityService.js';
import type { NoteEntityService } from './NoteEntityService.js';
import type { UserGroupInvitationEntityService } from './UserGroupInvitationEntityService.js';

@Injectable()
export class NotificationEntityService implements OnModuleInit {
	private userEntityService: UserEntityService;
	private noteEntityService: NoteEntityService;
	private userGroupInvitationEntityService: UserGroupInvitationEntityService;
	private customEmojiService: CustomEmojiService;

	constructor(
		private moduleRef: ModuleRef,

		@Inject(DI.notificationsRepository)
		private notificationsRepository: NotificationsRepository,

		@Inject(DI.noteReactionsRepository)
		private noteReactionsRepository: NoteReactionsRepository,

		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,

		//private userEntityService: UserEntityService,
		//private noteEntityService: NoteEntityService,
		//private userGroupInvitationEntityService: UserGroupInvitationEntityService,
		//private customEmojiService: CustomEmojiService,
	) {
	}

	onModuleInit() {
		this.userEntityService = this.moduleRef.get('UserEntityService');
		this.noteEntityService = this.moduleRef.get('NoteEntityService');
		this.userGroupInvitationEntityService = this.moduleRef.get('UserGroupInvitationEntityService');
		this.customEmojiService = this.moduleRef.get('CustomEmojiService');
	}

	public async pack(
		src: Notification['id'] | Notification,
		options: {
			_hintForEachNotes_?: {
				myReactions: Map<Note['id'], NoteReaction | null>;
			};
		},
	): Promise<Packed<'Notification'>> {
		const notification = typeof src === 'object' ? src : await this.notificationsRepository.findOneByOrFail({ id: src });
		const token = notification.appAccessTokenId ? await this.accessTokensRepository.findOneByOrFail({ id: notification.appAccessTokenId }) : null;

		return await awaitAll({
			id: notification.id,
			createdAt: notification.createdAt.toISOString(),
			type: notification.type,
			isRead: notification.isRead,
			userId: notification.notifierId,
			user: notification.notifierId ? this.userEntityService.pack(notification.notifier ?? notification.notifierId) : null,
			...(notification.type === 'mention' ? {
				note: this.noteEntityService.pack(notification.note ?? notification.noteId!, { id: notification.notifieeId }, {
					detail: true,
					_hint_: options._hintForEachNotes_,
				}),
			} : {}),
			...(notification.type === 'reply' ? {
				note: this.noteEntityService.pack(notification.note ?? notification.noteId!, { id: notification.notifieeId }, {
					detail: true,
					_hint_: options._hintForEachNotes_,
				}),
			} : {}),
			...(notification.type === 'renote' ? {
				note: this.noteEntityService.pack(notification.note ?? notification.noteId!, { id: notification.notifieeId }, {
					detail: true,
					_hint_: options._hintForEachNotes_,
				}),
			} : {}),
			...(notification.type === 'quote' ? {
				note: this.noteEntityService.pack(notification.note ?? notification.noteId!, { id: notification.notifieeId }, {
					detail: true,
					_hint_: options._hintForEachNotes_,
				}),
			} : {}),
			...(notification.type === 'reaction' ? {
				note: this.noteEntityService.pack(notification.note ?? notification.noteId!, { id: notification.notifieeId }, {
					detail: true,
					_hint_: options._hintForEachNotes_,
				}),
				reaction: notification.reaction,
			} : {}),
			...(notification.type === 'pollVote' ? {
				note: this.noteEntityService.pack(notification.note ?? notification.noteId!, { id: notification.notifieeId }, {
					detail: true,
					_hint_: options._hintForEachNotes_,
				}),
				choice: notification.choice,
			} : {}),
			...(notification.type === 'pollEnded' ? {
				note: this.noteEntityService.pack(notification.note ?? notification.noteId!, { id: notification.notifieeId }, {
					detail: true,
					_hint_: options._hintForEachNotes_,
				}),
			} : {}),
			...(notification.type === 'groupInvited' ? {
				invitation: this.userGroupInvitationEntityService.pack(notification.userGroupInvitationId!),
			} : {}),
			...(notification.type === 'app' ? {
				body: notification.customBody,
				header: notification.customHeader ?? token?.name,
				icon: notification.customIcon ?? token?.iconUrl,
			} : {}),
		});
	}

	public async packMany(
		notifications: Notification[],
		meId: User['id'],
	) {
		if (notifications.length === 0) return [];

		const notes = notifications.filter(x => x.note != null).map(x => x.note!);
		const noteIds = notes.map(n => n.id);
		const myReactionsMap = new Map<Note['id'], NoteReaction | null>();
		const renoteIds = notes.filter(n => n.renoteId != null).map(n => n.renoteId!);
		const targets = [...noteIds, ...renoteIds];
		const myReactions = await this.noteReactionsRepository.findBy({
			userId: meId,
			noteId: In(targets),
		});

		for (const target of targets) {
			myReactionsMap.set(target, myReactions.find(reaction => reaction.noteId === target) ?? null);
		}

		await this.customEmojiService.prefetchEmojis(this.customEmojiService.aggregateNoteEmojis(notes));

		return await Promise.all(notifications.map(x => this.pack(x, {
			_hintForEachNotes_: {
				myReactions: myReactionsMap,
			},
		})));
	}
}
