/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type { Packed } from '@/misc/json-schema.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { bindThis } from '@/decorators.js';
import { RoleService } from '@/core/RoleService.js';
import { isRenotePacked, isQuotePacked } from '@/misc/is-renote.js';
import type { JsonObject } from '@/misc/json-value.js';
import { FeaturedService } from '@/core/FeaturedService.js';
import Channel, { type MiChannelService } from '../channel.js';

class HanamiTimelineChannel extends Channel {
	public readonly chName = 'hanamiTimeline';
	public static shouldShare = false;
	public static requireCredential = true as const;
	public static kind = 'read:account';
	private withRenotes: boolean;
	private withFiles: boolean;

	private featuredNoteIds: string[];
	private globalNotesRankingCache: string[] = [];
	private globalNotesRankingCacheLastFetchedAt = 0;

	constructor(
		private noteEntityService: NoteEntityService,
		private roleService: RoleService,
		private featuredService: FeaturedService,

		id: string,
		connection: Channel['connection'],
	) {
		super(id, connection);
		//this.onNote = this.onNote.bind(this);
	}

	@bindThis
	public async init(params: JsonObject): Promise<void> {
		const policies = await this.roleService.getUserPolicies(this.user ? this.user.id : null);
		if (!policies.hanamiTlAvailable) return;

		const shouldUseCache = this.globalNotesRankingCacheLastFetchedAt !== 0
			&& (Date.now() - this.globalNotesRankingCacheLastFetchedAt < 1000 * 60 * 30);

		this.featuredNoteIds = shouldUseCache
			? this.globalNotesRankingCache
			: await this.featuredService.getGlobalNotesRanking(100);

		if (!shouldUseCache) {
			this.globalNotesRankingCache = this.featuredNoteIds;
			this.globalNotesRankingCacheLastFetchedAt = Date.now();
		}

		this.withRenotes = !!(params.withRenotes ?? true);
		this.withFiles = !!(params.withFiles ?? false);

		this.subscriber.on('notesStream', this.onNote);
	}

	@bindThis
	private async onNote(note: Packed<'Note'>) {
		const isMe = this.user!.id === note.userId;

		if (this.withFiles && (note.fileIds == null || note.fileIds.length === 0)) return;

		const followingSet = new Set(Object.keys(this.following));

		if (isRenotePacked(note) && this.featuredNoteIds.includes(note.renoteId) && note.visibility === 'public') {
			// セルフリノートは弾く
			if (note.userId === note.renote?.userId) {
				return;
			}
			// 20% の確率でタイムラインに表示
			const randomChance = Math.random();
			if (randomChance > 0.2) {
				return;
			}
		} else {
			// その投稿のユーザーをフォローしていなかったら弾く
			if (note.channelId) {
				if (!this.followingChannels.has(note.channelId)) return;
			} else {
				if (!isMe && !followingSet.has(note.userId)) return;
			}
		}

		if (note.visibility === 'followers') {
			if (!isMe && !followingSet.has(note.userId)) return;
		} else if (note.visibility === 'specified') {
			const visibleUserIdsSet = new Set(note.visibleUserIds ?? []); // null または undefined の場合に空配列
			if (!isMe && !visibleUserIdsSet.has(this.user!.id)) return;
		}

		if (note.reply) {
			const reply = note.reply;
			if (this.following[note.userId]?.withReplies) {
				// 自分のフォローしていないユーザーの visibility: followers な投稿への返信は弾く
				if (reply.visibility === 'followers' && !followingSet.has(reply.userId) && reply.userId !== this.user!.id) return;
			} else {
				// 「チャンネル接続主への返信」でもなければ、「チャンネル接続主が行った返信」でもなければ、「投稿者の投稿者自身への返信」でもない場合
				if (reply.userId !== this.user!.id && !isMe && reply.userId !== note.userId) return;
			}
		}

		// 純粋なリノート（引用リノートでないリノート）の場合
		if (isRenotePacked(note) && !isQuotePacked(note) && note.renote) {
			if (!this.withRenotes) return;
			if (note.renote.reply) {
				const reply = note.renote.reply;
				// 自分のフォローしていないユーザーの visibility: followers な投稿への返信のリノートは弾く
				if (reply.visibility === 'followers' && !followingSet.has(reply.userId) && reply.userId !== this.user!.id) return;
			}
		}

		if (this.isNoteMutedOrBlocked(note)) return;

		const reactionMutedNote = await this.removeMutedReactions(note);

		if (this.user && isRenotePacked(reactionMutedNote) && !isQuotePacked(reactionMutedNote)) {
			if (reactionMutedNote.renote && Object.keys(reactionMutedNote.renote.reactions).length > 0) {
				const myRenoteReaction = await this.noteEntityService.populateMyReaction(reactionMutedNote.renote, this.user.id);
				reactionMutedNote.renote.myReaction = myRenoteReaction;
			}
		}

		this.connection.cacheNote(reactionMutedNote);

		this.send('note', reactionMutedNote);
	}

	@bindThis
	public dispose() {
		// Unsubscribe events
		this.subscriber.off('notesStream', this.onNote);
	}
}

@Injectable()
export class HanamiTimelineChannelService implements MiChannelService<true> {
	public readonly shouldShare = HanamiTimelineChannel.shouldShare;
	public readonly requireCredential = HanamiTimelineChannel.requireCredential;
	public readonly kind = HanamiTimelineChannel.kind;

	constructor(
		private noteEntityService: NoteEntityService,
		private roleService: RoleService,
		private featuredService: FeaturedService,
	) {
	}

	@bindThis
	public create(id: string, connection: Channel['connection']): HanamiTimelineChannel {
		return new HanamiTimelineChannel(
			this.noteEntityService,
			this.roleService,
			this.featuredService,
			id,
			connection,
		);
	}
}
