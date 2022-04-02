import { In, Repository } from 'typeorm';
import { Users, Notes, UserGroupInvitations, AccessTokens, NoteReactions } from '../index.js';
import { Notification } from '@/models/entities/notification.js';
import { awaitAll } from '@/prelude/await-all.js';
import { Packed } from '@/misc/schema.js';
import { Note } from '@/models/entities/note.js';
import { NoteReaction } from '@/models/entities/note-reaction.js';
import { User } from '@/models/entities/user.js';
import { aggregateNoteEmojis, prefetchEmojis } from '@/misc/populate-emojis.js';
import { notificationTypes } from '@/types.js';
import { db } from '@/db/postgre.js';

export const NotificationRepository = db.getRepository(Notification).extend({
	async pack(
		src: Notification['id'] | Notification,
		options: {
			_hintForEachNotes_?: {
				myReactions: Map<Note['id'], NoteReaction | null>;
			};
		}
	): Promise<Packed<'Notification'>> {
		const notification = typeof src === 'object' ? src : await this.findOneByOrFail({ id: src });
		const token = notification.appAccessTokenId ? await AccessTokens.findOneByOrFail({ id: notification.appAccessTokenId }) : null;

		return await awaitAll({
			id: notification.id,
			createdAt: notification.createdAt.toISOString(),
			type: notification.type,
			isRead: notification.isRead,
			userId: notification.notifierId,
			user: notification.notifierId ? Users.pack(notification.notifier || notification.notifierId) : null,
			...(notification.type === 'mention' ? {
				note: Notes.pack(notification.note || notification.noteId!, { id: notification.notifieeId }, {
					detail: true,
					_hint_: options._hintForEachNotes_,
				}),
			} : {}),
			...(notification.type === 'reply' ? {
				note: Notes.pack(notification.note || notification.noteId!, { id: notification.notifieeId }, {
					detail: true,
					_hint_: options._hintForEachNotes_,
				}),
			} : {}),
			...(notification.type === 'renote' ? {
				note: Notes.pack(notification.note || notification.noteId!, { id: notification.notifieeId }, {
					detail: true,
					_hint_: options._hintForEachNotes_,
				}),
			} : {}),
			...(notification.type === 'quote' ? {
				note: Notes.pack(notification.note || notification.noteId!, { id: notification.notifieeId }, {
					detail: true,
					_hint_: options._hintForEachNotes_,
				}),
			} : {}),
			...(notification.type === 'reaction' ? {
				note: Notes.pack(notification.note || notification.noteId!, { id: notification.notifieeId }, {
					detail: true,
					_hint_: options._hintForEachNotes_,
				}),
				reaction: notification.reaction,
			} : {}),
			...(notification.type === 'pollVote' ? {
				note: Notes.pack(notification.note || notification.noteId!, { id: notification.notifieeId }, {
					detail: true,
					_hint_: options._hintForEachNotes_,
				}),
				choice: notification.choice,
			} : {}),
			...(notification.type === 'pollEnded' ? {
				note: Notes.pack(notification.note || notification.noteId!, { id: notification.notifieeId }, {
					detail: true,
					_hint_: options._hintForEachNotes_,
				}),
			} : {}),
			...(notification.type === 'groupInvited' ? {
				invitation: UserGroupInvitations.pack(notification.userGroupInvitationId!),
			} : {}),
			...(notification.type === 'app' ? {
				body: notification.customBody,
				header: notification.customHeader || token?.name,
				icon: notification.customIcon || token?.iconUrl,
			} : {}),
		});
	},

	async packMany(
		notifications: Notification[],
		meId: User['id']
	) {
		if (notifications.length === 0) return [];

		const notes = notifications.filter(x => x.note != null).map(x => x.note!);
		const noteIds = notes.map(n => n.id);
		const myReactionsMap = new Map<Note['id'], NoteReaction | null>();
		const renoteIds = notes.filter(n => n.renoteId != null).map(n => n.renoteId!);
		const targets = [...noteIds, ...renoteIds];
		const myReactions = await NoteReactions.findBy({
			userId: meId,
			noteId: In(targets),
		});

		for (const target of targets) {
			myReactionsMap.set(target, myReactions.find(reaction => reaction.noteId === target) || null);
		}

		await prefetchEmojis(aggregateNoteEmojis(notes));

		return await Promise.all(notifications.map(x => this.pack(x, {
			_hintForEachNotes_: {
				myReactions: myReactionsMap,
			},
		})));
	},
});
