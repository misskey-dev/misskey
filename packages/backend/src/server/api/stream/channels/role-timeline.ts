/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { bindThis } from '@/decorators.js';
import { RoleService } from '@/core/RoleService.js';
import type { GlobalEvents } from '@/core/GlobalEventService.js';
import type { JsonObject } from '@/misc/json-value.js';
import Channel, { type MiChannelService } from '../channel.js';

class RoleTimelineChannel extends Channel {
	public readonly chName = 'roleTimeline';
	public static shouldShare = false;
	public static requireCredential = false as const;
	private roleId: string;

	constructor(
		private noteEntityService: NoteEntityService,
		private roleservice: RoleService,

		id: string,
		connection: Channel['connection'],
	) {
		super(id, connection);
		//this.onNote = this.onNote.bind(this);
	}

	@bindThis
	public async init(params: JsonObject) {
		if (typeof params.roleId !== 'string') return;
		this.roleId = params.roleId;

		this.subscriber.on(`roleTimelineStream:${this.roleId}`, this.onEvent);
	}

	@bindThis
	private async onEvent(data: GlobalEvents['roleTimeline']['payload']) {
		if (data.type === 'note') {
			const note = data.body;

			if (!(await this.roleservice.isExplorable({ id: this.roleId }))) {
				return;
			}
			if (note.visibility !== 'public') return;

			if (this.isNoteMutedOrBlocked(note)) return;

			this.send('note', note);
		} else {
			this.send(data.type, data.body);
		}
	}

	@bindThis
	public dispose() {
		// Unsubscribe events
		this.subscriber.off(`roleTimelineStream:${this.roleId}`, this.onEvent);
	}
}

@Injectable()
export class RoleTimelineChannelService implements MiChannelService<false> {
	public readonly shouldShare = RoleTimelineChannel.shouldShare;
	public readonly requireCredential = RoleTimelineChannel.requireCredential;
	public readonly kind = RoleTimelineChannel.kind;

	constructor(
		private noteEntityService: NoteEntityService,
		private roleservice: RoleService,
	) {
	}

	@bindThis
	public create(id: string, connection: Channel['connection']): RoleTimelineChannel {
		return new RoleTimelineChannel(
			this.noteEntityService,
			this.roleservice,
			id,
			connection,
		);
	}
}
