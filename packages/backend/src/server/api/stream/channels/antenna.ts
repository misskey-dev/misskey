/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, Scope } from '@nestjs/common';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { bindThis } from '@/decorators.js';
import { isRenotePacked, isQuotePacked } from '@/misc/is-renote.js';
import type { GlobalEvents } from '@/core/GlobalEventService.js';
import type { JsonObject } from '@/misc/json-value.js';
import Channel, { type ChannelRequest } from '../channel.js';
import { NoteStreamingLockdownService } from '../NoteStreamingLockdownService.js';
import { REQUEST } from '@nestjs/core';

@Injectable({ scope: Scope.TRANSIENT })
export class AntennaChannel extends Channel {
	public readonly chName = 'antenna';
	public static shouldShare = false;
	public static requireCredential = true as const;
	public static kind = 'read:account';
	private antennaId: string;

	constructor(
		@Inject(REQUEST)
		request: ChannelRequest,

		private noteEntityService: NoteEntityService,
		private noteStreamingFilterService: NoteStreamingLockdownService,
	) {
		super(request);
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

			const { shouldSkip: shouldSkipByLockdown } = await this.noteStreamingFilterService.processLockdown(note, this.user?.id ?? null);
			if (shouldSkipByLockdown) return;

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
