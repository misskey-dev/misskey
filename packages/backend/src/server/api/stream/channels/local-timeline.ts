import { Injectable } from '@nestjs/common';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import type { Packed } from '@/misc/schema.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { bindThis } from '@/decorators.js';
import Channel from '../channel.js';

class LocalTimelineChannel extends Channel {
	public readonly chName = 'localTimeline';
	public static shouldShare = true;
	public static requireCredential = false;
	private q: string[][];

	constructor(
		private noteEntityService: NoteEntityService,

		id: string,
		connection: Channel['connection'],
	) {
		super(id, connection);
		//this.onNote = this.onNote.bind(this);
	}

	@bindThis
	public async init(params: any) {
		this.q = [['precure_fun']];

		if (this.q == null) return;

		// Subscribe stream
		this.subscriber.on('notesStream', this.onNote);
	}

	@bindThis
	private async onNote(note: Packed<'Note'>) {
		const noteTags = note.tags ? note.tags.map((t: string) => t.toLowerCase()) : [];
		const matched = this.q.some(tags => tags.every(tag => noteTags.includes(normalizeForSearch(tag))));
		if (!matched) return;

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

	@bindThis
	public dispose() {
		// Unsubscribe events
		this.subscriber.off('notesStream', this.onNote);
	}
}

@Injectable()
export class LocalTimelineChannelService {
	public readonly shouldShare = LocalTimelineChannel.shouldShare;
	public readonly requireCredential = LocalTimelineChannel.requireCredential;

	constructor(
		private noteEntityService: NoteEntityService,
	) {
	}

	@bindThis
	public create(id: string, connection: Channel['connection']): LocalTimelineChannel {
		return new LocalTimelineChannel(
			this.noteEntityService,
			id,
			connection,
		);
	}
}
