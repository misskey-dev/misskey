import { Injectable } from '@nestjs/common';
import { isUserRelated } from '@/misc/is-user-related.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { bindThis } from '@/decorators.js';
import Channel from '../channel.js';
import type { StreamMessages } from '../types.js';

class AntennaChannel extends Channel {
	public readonly chName = 'antenna';
	public static shouldShare = false;
	public static requireCredential = false;
	private antennaId: string;

	constructor(
		private noteEntityService: NoteEntityService,

		id: string,
		connection: Channel['connection'],
	) {
		super(id, connection);
		//this.onEvent = this.onEvent.bind(this);
	}

	@bindThis
	public async init(params: any) {
		this.antennaId = params.antennaId as string;

		// Subscribe stream
		this.subscriber.on(`antennaStream:${this.antennaId}`, this.onEvent);
	}

	@bindThis
	private async onEvent(data: StreamMessages['antenna']['payload']) {
		if (data.type === 'note') {
			const note = await this.noteEntityService.pack(data.body.id, this.user, { detail: true });

			// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
			if (isUserRelated(note, this.muting)) return;
			// 流れてきたNoteがブロックされているユーザーが関わるものだったら無視する
			if (isUserRelated(note, this.blocking)) return;

			if (note.renote && !note.text && isUserRelated(note, this.renoteMuting)) return;

			this.connection.cacheNote(note);

			this.send('note', note);
		} else {
			this.send(data.type, data.body);
		}
	}

	@bindThis
	public dispose() {
		// Unsubscribe events
		this.subscriber.off(`antennaStream:${this.antennaId}`, this.onEvent);
	}
}

@Injectable()
export class AntennaChannelService {
	public readonly shouldShare = AntennaChannel.shouldShare;
	public readonly requireCredential = AntennaChannel.requireCredential;

	constructor(
		private noteEntityService: NoteEntityService,
	) {
	}

	@bindThis
	public create(id: string, connection: Channel['connection']): AntennaChannel {
		return new AntennaChannel(
			this.noteEntityService,
			id,
			connection,
		);
	}
}
