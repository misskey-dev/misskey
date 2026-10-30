/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, Scope } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { AntennasRepository } from '@/models/_.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { NoteStreamingHidingService } from '../NoteStreamingHidingService.js';
import { bindThis } from '@/decorators.js';
import type { GlobalEvents } from '@/core/GlobalEventService.js';
import type { JsonObject } from '@/misc/json-value.js';
import Channel, { type ChannelRequest } from '../channel.js';
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

		@Inject(DI.antennasRepository)
		private antennasReposiotry: AntennasRepository,

		private noteEntityService: NoteEntityService,
		private noteStreamingHidingService: NoteStreamingHidingService,
	) {
		super(request);
		//this.onEvent = this.onEvent.bind(this);
	}

	@bindThis
	public async init(params: JsonObject): Promise<boolean> {
		if (typeof params.antennaId !== 'string') return false;
		if (!this.user) return false;

		this.antennaId = params.antennaId;

		const antennaExists = await this.antennasReposiotry.exists({
			where: {
				id: this.antennaId,
				userId: this.user.id,
			},
		});

		if (!antennaExists) return false;

		// Subscribe stream
		this.subscriber.on(`antennaStream:${this.antennaId}`, this.onEvent);

		return true;
	}

	@bindThis
	private async onEvent(data: GlobalEvents['antenna']['payload']) {
		if (data.type === 'note') {
			let note = data.body;

			if (!this.isNoteVisibleForMe(note)) return;
			if (this.isNoteMutedOrBlocked(note)) return;

			const filtered = await this.noteStreamingHidingService.filter(note, this.user?.id ?? null);
			if (!filtered) return;
			note = filtered;

			this.send('note', await this.noteEntityService.withMyRenoteReaction(note, this.user?.id ?? null));
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
