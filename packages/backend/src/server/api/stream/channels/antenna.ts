/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { bindThis } from '@/decorators.js';
import { isRenotePacked, isQuotePacked } from '@/misc/is-renote.js';
import type { GlobalEvents } from '@/core/GlobalEventService.js';
import type { JsonObject } from '@/misc/json-value.js';
import Channel, { type MiChannelService } from '../channel.js';
import { NoteStreamingFilterService } from '../NoteStreamingFilterService.js';

class AntennaChannel extends Channel {
	public readonly chName = 'antenna';
	public static shouldShare = false;
	public static requireCredential = true as const;
	public static kind = 'read:account';
	private antennaId: string;

	constructor(
		private noteEntityService: NoteEntityService,
		private noteStreamingFilterService: NoteStreamingFilterService,

		id: string,
		connection: Channel['connection'],
	) {
		super(id, connection);
		//this.onEvent = this.onEvent.bind(this);
	}

	@bindThis
	public async init(params: JsonObject) {
		if (typeof params.antennaId !== 'string') return;
		this.antennaId = params.antennaId;

		// Subscribe stream
		this.subscriber.on(`antennaStream:${this.antennaId}`, this.onEvent);
	}

	@bindThis
	private async onEvent(data: GlobalEvents['antenna']['payload']) {
		if (data.type === 'note') {
			const note = await this.noteEntityService.pack(data.body.id, this.user, { detail: true });

			if (this.isNoteMutedOrBlocked(note)) return;

			const filterResult = await this.noteStreamingFilterService.filterForStreaming(note, this.user?.id ?? null);
			if (filterResult === 'skip') return;

			if (this.user) {
				if (isRenotePacked(note) && !isQuotePacked(note)) {
					if (note.renote && Object.keys(note.renote.reactions).length > 0) {
						const myRenoteReaction = await this.noteEntityService.populateMyReaction(note.renote, this.user.id);
						note.renote.myReaction = myRenoteReaction;
					}
				}
			}

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
export class AntennaChannelService implements MiChannelService<true> {
	public readonly shouldShare = AntennaChannel.shouldShare;
	public readonly requireCredential = AntennaChannel.requireCredential;
	public readonly kind = AntennaChannel.kind;

	constructor(
		private noteEntityService: NoteEntityService,
		private noteStreamingFilterService: NoteStreamingFilterService,
	) {
	}

	@bindThis
	public create(id: string, connection: Channel['connection']): AntennaChannel {
		return new AntennaChannel(
			this.noteEntityService,
			this.noteStreamingFilterService,
			id,
			connection,
		);
	}
}
