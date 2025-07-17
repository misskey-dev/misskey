/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { isUserRelated } from '@/misc/is-user-related.js';
import type { Packed } from '@/misc/json-schema.js';
import { MetaService } from '@/core/MetaService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { bindThis } from '@/decorators.js';
import { RoleService } from '@/core/RoleService.js';
import { VmimiRelayTimelineService } from '@/core/VmimiRelayTimelineService.js';
import { isRenotePacked, isQuotePacked } from '@/misc/is-renote.js';
import Channel, { type MiChannelService } from '../channel.js';

class VmimiRelayHybridTimelineChannel extends Channel {
	public readonly chName = 'vmimiRelayHybridTimeline';
	public static shouldShare = false;
	public static requireCredential = true as const;
	public static kind = 'read:account';
	private withRenotes: boolean;
	private withReplies: boolean;
	private withFiles: boolean;
	private withLocalOnly: boolean;

	constructor(
		private metaService: MetaService,
		private roleService: RoleService,
		private noteEntityService: NoteEntityService,
		private vmimiRelayTimelineService: VmimiRelayTimelineService,

		id: string,
		connection: Channel['connection'],
	) {
		super(id, connection);
		//this.onNote = this.onNote.bind(this);
	}

	@bindThis
	public async init(params: any): Promise<void> {
		const policies = await this.roleService.getUserPolicies(this.user ? this.user.id : null);
		if (!policies.vrtlAvailable) return;

		this.withRenotes = params.withRenotes ?? true;
		this.withReplies = params.withReplies ?? false;
		this.withFiles = params.withFiles ?? false;
		this.withLocalOnly = params.withLocalOnly ?? true;

		// Subscribe events
		this.subscriber.on('notesStream', this.onNote);
	}

	@bindThis
	private async onNote(note: Packed<'Note'>) {
		const isMe = this.user!.id === note.userId;

		if (this.withFiles && (note.fileIds == null || note.fileIds.length === 0)) return;

		// チャンネルの投稿ではなく、自分自身の投稿 または
		// チャンネルの投稿ではなく、その投稿のユーザーをフォローしている または
		// チャンネルの投稿ではなく、全体公開のぶいみみリレーまたはローカルの投稿 または
		// フォローしているチャンネルの投稿 の場合だけ
		if (!(
			(note.channelId == null && isMe) ||
			(note.channelId == null && Object.hasOwn(this.following, note.userId)) ||
			(note.channelId == null && (this.vmimiRelayTimelineService.isRelayedInstance(note.user.host) && note.visibility === 'public') && (this.withLocalOnly || !note.localOnly)) ||
			(note.channelId != null && this.followingChannels.has(note.channelId))
		)) return;

		if (note.visibility === 'followers') {
			if (!isMe && !Object.hasOwn(this.following, note.userId)) return;
		} else if (note.visibility === 'specified') {
			if (!isMe && !note.visibleUserIds!.includes(this.user!.id)) return;
		}

		if (this.isNoteMutedOrBlocked(note)) return;

		if (note.reply) {
			const reply = note.reply;
			if ((this.following[note.userId]?.withReplies ?? false) || this.withReplies) {
				// 自分のフォローしていないユーザーの visibility: followers な投稿への返信は弾く
				if (reply.visibility === 'followers' && !Object.hasOwn(this.following, reply.userId)) return;
			} else {
				// 「チャンネル接続主への返信」でもなければ、「チャンネル接続主が行った返信」でもなければ、「投稿者の投稿者自身への返信」でもない場合
				if (reply.userId !== this.user!.id && !isMe && reply.userId !== note.userId) return;
			}
		}

		if (isRenotePacked(note) && !isQuotePacked(note) && !this.withRenotes) return;

		if (this.user && note.renoteId && !note.text) {
			if (note.renote && Object.keys(note.renote.reactions).length > 0) {
				console.log(note.renote.reactionAndUserPairCache);
				const myRenoteReaction = await this.noteEntityService.populateMyReaction(note.renote, this.user.id);
				note.renote.myReaction = myRenoteReaction;
			}
		}

		this.connection.cacheNote(note);

		this.send('note', note);
	}

	@bindThis
	public dispose(): void {
		// Unsubscribe events
		this.subscriber.off('notesStream', this.onNote);
	}
}

@Injectable()
export class VmimiRelayHybridTimelineChannelService implements MiChannelService<true> {
	public readonly shouldShare = VmimiRelayHybridTimelineChannel.shouldShare;
	public readonly requireCredential = VmimiRelayHybridTimelineChannel.requireCredential;
	public readonly kind = VmimiRelayHybridTimelineChannel.kind;

	constructor(
		private metaService: MetaService,
		private roleService: RoleService,
		private noteEntityService: NoteEntityService,
		private vmimiRelayTimelineService: VmimiRelayTimelineService,
	) {
	}

	@bindThis
	public create(id: string, connection: Channel['connection']): VmimiRelayHybridTimelineChannel {
		return new VmimiRelayHybridTimelineChannel(
			this.metaService,
			this.roleService,
			this.noteEntityService,
			this.vmimiRelayTimelineService,
			id,
			connection,
		);
	}
}
