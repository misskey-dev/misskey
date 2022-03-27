import Channel from '../channel.js';
import { Notes, UserListJoinings, UserLists } from '@/models/index.js';
import { isMutedUserRelated } from '@/misc/is-muted-user-related.js';
import { User } from '@/models/entities/user.js';
import { isBlockerUserRelated } from '@/misc/is-blocker-user-related.js';
import { Packed } from '@/misc/schema.js';

export default class extends Channel {
	public readonly chName = 'userList';
	public static shouldShare = false;
	public static requireCredential = false;
	private listId: string;
	public listUsers: User['id'][] = [];
	private listUsersClock: NodeJS.Timer;

	constructor(id: string, connection: Channel['connection']) {
		super(id, connection);
		this.updateListUsers = this.updateListUsers.bind(this);
		this.onNote = this.onNote.bind(this);
	}

	public async init(params: any) {
		this.listId = params.listId as string;

		// Check existence and owner
		const list = await UserLists.findOneBy({
			id: this.listId,
			userId: this.user!.id,
		});
		if (!list) return;

		// Subscribe stream
		this.subscriber.on(`userListStream:${this.listId}`, this.send);

		this.subscriber.on('notesStream', this.onNote);

		this.updateListUsers();
		this.listUsersClock = setInterval(this.updateListUsers, 5000);
	}

	private async updateListUsers() {
		const users = await UserListJoinings.find({
			where: {
				userListId: this.listId,
			},
			select: ['userId'],
		});

		this.listUsers = users.map(x => x.userId);
	}

	private async onNote(note: Packed<'Note'>) {
		if (!this.listUsers.includes(note.userId)) return;

		if (['followers', 'specified'].includes(note.visibility)) {
			note = await Notes.pack(note.id, this.user, {
				detail: true,
			});

			if (note.isHidden) {
				return;
			}
		} else {
			// リプライなら再pack
			if (note.replyId != null) {
				note.reply = await Notes.pack(note.replyId, this.user, {
					detail: true,
				});
			}
			// Renoteなら再pack
			if (note.renoteId != null) {
				note.renote = await Notes.pack(note.renoteId, this.user, {
					detail: true,
				});
			}
		}

		// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
		if (isMutedUserRelated(note, this.muting)) return;
		// 流れてきたNoteがブロックされているユーザーが関わるものだったら無視する
		if (isBlockerUserRelated(note, this.blocking)) return;

		this.send('note', note);
	}

	public dispose() {
		// Unsubscribe events
		this.subscriber.off(`userListStream:${this.listId}`, this.send);
		this.subscriber.off('notesStream', this.onNote);

		clearInterval(this.listUsersClock);
	}
}
