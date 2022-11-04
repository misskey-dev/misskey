import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository, UsersRepository } from '@/models/index.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import type { User } from '@/models/entities/User.js';
import type { Packed } from '@/misc/schema.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import Channel from '../channel.js';
import type { StreamMessages } from '../types.js';

class ChannelChannel extends Channel {
	public readonly chName = 'channel';
	public static shouldShare = false;
	public static requireCredential = false;
	private channelId: string;
	private typers: Record<User['id'], Date> = {};
	private emitTypersIntervalId: ReturnType<typeof setInterval>;

	constructor(
		private noteEntityService: NoteEntityService,
		private userEntityService: UserEntityService,

		id: string,
		connection: Channel['connection'],
	) {
		super(id, connection);
		this.onNote = this.onNote.bind(this);
		this.emitTypers = this.emitTypers.bind(this);
	}

	public async init(params: any) {
		this.channelId = params.channelId as string;

		// Subscribe stream
		this.subscriber.on('notesStream', this.onNote);
		this.subscriber.on(`channelStream:${this.channelId}`, this.onEvent);
		this.emitTypersIntervalId = setInterval(this.emitTypers, 5000);
	}

	private async onNote(note: Packed<'Note'>) {
		if (note.channelId !== this.channelId) return;

		// リプライなら再pack
		if (note.replyId != null) {
			note.reply = await this.noteEntityService.pack(note.replyId, this.user, {
				detail: true,
			});
		}
		// Renoteなら再pack
		if (note.renoteId != null) {
			note.renote = await this.noteEntityService.pack(note.renoteId, this.user, {
				detail: true,
			});
		}

		// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
		if (isUserRelated(note, this.muting)) return;
		// 流れてきたNoteがブロックされているユーザーが関わるものだったら無視する
		if (isUserRelated(note, this.blocking)) return;

		this.connection.cacheNote(note);

		this.send('note', note);
	}

	private onEvent(data: StreamMessages['channel']['payload']) {
		if (data.type === 'typing') {
			const id = data.body;
			const begin = this.typers[id] == null;
			this.typers[id] = new Date();
			if (begin) {
				this.emitTypers();
			}
		}
	}

	private async emitTypers() {
		const now = new Date();

		// Remove not typing users
		for (const [userId, date] of Object.entries(this.typers)) {
			if (now.getTime() - date.getTime() > 5000) delete this.typers[userId];
		}

		const users = await this.userEntityService.packMany(Object.keys(this.typers), null, { detail: false });

		this.send({
			type: 'typers',
			body: users,
		});
	}

	public dispose() {
		// Unsubscribe events
		this.subscriber.off('notesStream', this.onNote);
		this.subscriber.off(`channelStream:${this.channelId}`, this.onEvent);

		clearInterval(this.emitTypersIntervalId);
	}
}

@Injectable()
export class ChannelChannelService {
	public readonly shouldShare = ChannelChannel.shouldShare;
	public readonly requireCredential = ChannelChannel.requireCredential;

	constructor(
		private noteEntityService: NoteEntityService,
		private userEntityService: UserEntityService,
	) {
	}

	public create(id: string, connection: Channel['connection']): ChannelChannel {
		return new ChannelChannel(
			this.noteEntityService,
			this.userEntityService,
			id,
			connection,
		);
	}
}
