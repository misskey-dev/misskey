/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import type { Packed } from '@/misc/json-schema.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { NoteStreamingHidingService } from '../NoteStreamingHidingService.js';
import { bindThis } from '@/decorators.js';
import { isRenotePacked, isQuotePacked } from '@/misc/is-renote.js';
import type { JsonObject } from '@/misc/json-value.js';
import Channel, { type MiChannelService } from '../channel.js';

class HashtagChannel extends Channel {
	public readonly chName = 'hashtag';
	public static shouldShare = false;
	public static requireCredential = false as const;
	private q: string[][];

	constructor(
		private noteEntityService: NoteEntityService,
		private noteStreamingHidingService: NoteStreamingHidingService,

		id: string,
		connection: Channel['connection'],
	) {
		super(id, connection);
		//this.onNote = this.onNote.bind(this);
	}

	@bindThis
	public async init(params: JsonObject): Promise<boolean> {
		if (!Array.isArray(params.q)) return false;
		if (!params.q.every((x): x is string[] => (
			Array.isArray(x) &&
			x.length >= 1 &&
			x.every(y => typeof y === 'string')
		))) return false;
		this.q = params.q;

		// Subscribe stream
		this.subscriber.on('notesStream', this.onNote);

		return true;
	}

	@bindThis
	private async onNote(note: Packed<'Note'>) {
		const noteTags = note.tags ? note.tags.map((t: string) => t.toLowerCase()) : [];
		const matched = this.q.some(tags => tags.every(tag => noteTags.includes(normalizeForSearch(tag))));
		if (!matched) return;

		if (!this.isNoteVisibleForMe(note)) return;
		if (note.user.requireSigninToViewContents && this.user == null) return;
		if (note.renote && note.renote.user.requireSigninToViewContents && this.user == null) return;
		if (note.reply && note.reply.user.requireSigninToViewContents && this.user == null) return;
		if (this.isNoteMutedOrBlocked(note)) return;

		const reactionMutedNote = await this.removeMutedReactions(note);

		const { shouldSkip } = await this.noteStreamingHidingService.processHiding(reactionMutedNote, this.user?.id ?? null);
		if (shouldSkip) return;

		if (this.user) {
			if (isRenotePacked(reactionMutedNote) && !isQuotePacked(reactionMutedNote)) {
				if (reactionMutedNote.renote && Object.keys(reactionMutedNote.renote.reactions).length > 0) {
					const myRenoteReaction = await this.noteEntityService.populateMyReaction(reactionMutedNote.renote, this.user.id);
					reactionMutedNote.renote.myReaction = myRenoteReaction;
				}
			}
		}

		this.send('note', reactionMutedNote);
	}

	@bindThis
	public dispose() {
		// Unsubscribe events
		this.subscriber.off('notesStream', this.onNote);
	}
}

@Injectable()
export class HashtagChannelService implements MiChannelService<false> {
	public readonly shouldShare = HashtagChannel.shouldShare;
	public readonly requireCredential = HashtagChannel.requireCredential;
	public readonly kind = HashtagChannel.kind;

	constructor(
		private noteEntityService: NoteEntityService,
		private noteStreamingHidingService: NoteStreamingHidingService,
	) {
	}

	@bindThis
	public create(id: string, connection: Channel['connection']): HashtagChannel {
		return new HashtagChannel(
			this.noteEntityService,
			this.noteStreamingHidingService,
			id,
			connection,
		);
	}
}
