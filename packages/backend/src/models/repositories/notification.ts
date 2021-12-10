import { EntityRepository, In, Repository } from 'typeorm';
import { Users, Notes, UserGroupInvitations, AccessTokens, NoteReactions } from '../index';
import { Notification } from '@/models/entities/notification';
import { awaitAll } from '@/prelude/await-all';
import { Packed } from '@/misc/schema';
import { Note } from '@/models/entities/note';
import { NoteReaction } from '@/models/entities/note-reaction';
import { User } from '@/models/entities/user';
import { aggregateNoteEmojis, prefetchEmojis } from '@/misc/populate-emojis';
import { notificationTypes } from '@/types';

@EntityRepository(Notification)
export class NotificationRepository extends Repository<Notification> {
	public async pack(
		src: Notification['id'] | Notification,
		options: {
			_hintForEachNotes_?: {
				myReactions: Map<Note['id'], NoteReaction | null>;
			};
		}
	): Promise<Packed<'Notification'>> {
		const notification = typeof src === 'object' ? src : await this.findOneOrFail(src);
		const token = notification.appAccessTokenId ? await AccessTokens.findOneOrFail(notification.appAccessTokenId) : null;

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
			...(notification.type === 'groupInvited' ? {
				invitation: UserGroupInvitations.pack(notification.userGroupInvitationId!),
			} : {}),
			...(notification.type === 'app' ? {
				body: notification.customBody,
				header: notification.customHeader || token?.name,
				icon: notification.customIcon || token?.iconUrl,
			} : {}),
		});
	}

	public async packMany(
		notifications: Notification[],
		meId: User['id']
	) {
		if (notifications.length === 0) return [];

		const notes = notifications.filter(x => x.note != null).map(x => x.note!);
		const noteIds = notes.map(n => n.id);
		const myReactionsMap = new Map<Note['id'], NoteReaction | null>();
		const renoteIds = notes.filter(n => n.renoteId != null).map(n => n.renoteId!);
		const targets = [...noteIds, ...renoteIds];
		const myReactions = await NoteReactions.find({
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
	}
}

export const packedNotificationSchema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		id: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'date-time',
		},
		isRead: {
			type: 'boolean' as const,
			optional: false as const, nullable: false as const,
		},
		type: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			enum: [...notificationTypes],
		},
		user: {
			type: 'object' as const,
			ref: 'User' as const,
			optional: true as const, nullable: true as const,
		},
		userId: {
			type: 'string' as const,
			optional: true as const, nullable: true as const,
			format: 'id',
		},
		note: {
			type: 'object' as const,
			ref: 'Note' as const,
			optional: true as const, nullable: true as const,
		},
		reaction: {
			type: 'string' as const,
			optional: true as const, nullable: true as const,
		},
		choice: {
			type: 'number' as const,
			optional: true as const, nullable: true as const,
		},
		invitation: {
			type: 'object' as const,
			optional: true as const, nullable: true as const,
		},
		body: {
			type: 'string' as const,
			optional: true as const, nullable: true as const,
		},
		header: {
			type: 'string' as const,
			optional: true as const, nullable: true as const,
		},
		icon: {
			type: 'string' as const,
			optional: true as const, nullable: true as const,
		},
	},
};
