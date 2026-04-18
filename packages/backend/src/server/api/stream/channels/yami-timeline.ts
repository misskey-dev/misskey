/*
 * SPDX-FileCopyrightText: hitalin and yamisskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, Scope } from '@nestjs/common';
import type { Packed } from '@/misc/json-schema.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { bindThis } from '@/decorators.js';
import { RoleService } from '@/core/RoleService.js';
import { isRenotePacked, isQuotePacked } from '@/misc/is-renote.js';
import type { JsonObject } from '@/misc/json-value.js';
import type { UsersRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { NoteStreamingHidingService } from '../NoteStreamingHidingService.js';
import Channel, { type ChannelRequest } from '../channel.js';
import { REQUEST } from '@nestjs/core';

@Injectable({ scope: Scope.TRANSIENT })
export class YamiTimelineChannel extends Channel {
	public readonly chName = 'yamiTimeline';
	public static shouldShare = false;
	public static requireCredential = true as const;
	public static kind = 'read:account';
	private withRenotes: boolean;
	private withFiles: boolean;
	private showYamiNonFollowingPublicNotes: boolean;
	private showYamiFollowingNotes: boolean;
	private excludeBots: boolean;

	constructor(
		@Inject(REQUEST)
		request: ChannelRequest,

		private noteEntityService: NoteEntityService,
		private noteStreamingHidingService: NoteStreamingHidingService,
		private roleService: RoleService,
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
	) {
		super(request);
	}

	@bindThis
	public async init(params: JsonObject): Promise<void> {
		// 最新のユーザー情報を再取得して、やみモード状態を確認
		if (this.user) {
			const freshUserInfo = await this.usersRepository.findOneBy({ id: this.user.id });
			if (freshUserInfo) {
				this.user.isInYamiMode = freshUserInfo.isInYamiMode;
			}
		}

		const policies = await this.roleService.getUserPolicies(this.user ? this.user.id : null);
		if (!policies.yamiTlAvailable) return;

		this.withRenotes = !!(params.withRenotes ?? true);
		this.withFiles = !!(params.withFiles ?? false);
		this.showYamiNonFollowingPublicNotes = !!(params.showYamiNonFollowingPublicNotes ?? true);
		this.showYamiFollowingNotes = !!(params.showYamiFollowingNotes ?? true);
		this.excludeBots = !!(params.excludeBots ?? false);

		// ノートストリームの購読
		this.subscriber.on('notesStream', this.onNote);
	}

	@bindThis
	private async onNote(note: Packed<'Note'>) {
		// やみモードの投稿のみ表示する
		if (!note.isNoteInYamiMode) return;

		const isMyNote = this.user!.id === note.userId;

		// Bot filtering
		if (this.excludeBots && note.user.isBot) return;

		// 自分がやみモードでない場合は自分の投稿だけ表示
		if (!isMyNote && !this.user!.isInYamiMode) return;

		if (this.withFiles && (note.fileIds == null || note.fileIds.length === 0)) return;

		// Yami TL 固有の表示制御 (showYami* プリファレンス)
		let shouldDisplay = false;
		if (isMyNote) {
			shouldDisplay = true;
		} else if (note.visibility === 'specified' && note.visibleUserIds?.includes(this.user!.id)) {
			// 自分宛てのダイレクト投稿は常に表示
			shouldDisplay = true;
		} else if (Object.hasOwn(this.following, note.userId)) {
			// フォロー中ユーザーの投稿 - showYamiFollowingNotes で制御
			shouldDisplay = this.showYamiFollowingNotes;
		} else if (note.visibility === 'public') {
			// フォロー外ユーザーのパブリック投稿 - showYamiNonFollowingPublicNotes で制御
			shouldDisplay = this.showYamiNonFollowingPublicNotes;
		}
		if (!shouldDisplay) return;

		// 本家共通の specified/followers 厳密判定
		if (!this.isNoteVisibleForMe(note)) return;

		if (note.channelId) {
			if (!this.followingChannels.has(note.channelId)) return;
		}

		if (note.reply) {
			const reply = note.reply;
			if (this.following[note.userId]?.withReplies) {
				// 自分のフォローしていないユーザーの visibility: followers な投稿への返信は弾く
				if (reply.visibility === 'followers' && !Object.hasOwn(this.following, reply.userId) && reply.userId !== this.user!.id) return;
			} else {
				// 「自分への返信」「自分の返信」「投稿者自身への返信」以外は弾く
				if (reply.userId !== this.user!.id && !isMyNote && reply.userId !== note.userId) return;
			}
		}

		// 純粋リノート (引用リノートでないリノート)
		if (isRenotePacked(note) && !isQuotePacked(note) && note.renote) {
			if (!this.withRenotes) return;
			if (note.renote.reply) {
				const reply = note.renote.reply;
				// 自分のフォローしていないユーザーの visibility: followers な投稿への返信のリノートは弾く
				if (reply.visibility === 'followers' && !Object.hasOwn(this.following, reply.userId) && reply.userId !== this.user!.id) return;
			}
		}

		if (this.isNoteMutedOrBlocked(note)) return;

		const { shouldSkip } = await this.noteStreamingHidingService.processHiding(note, this.user?.id ?? null);
		if (shouldSkip) return;

		if (this.user && isRenotePacked(note) && !isQuotePacked(note)) {
			if (note.renote && Object.keys(note.renote.reactions).length > 0) {
				const myRenoteReaction = await this.noteEntityService.populateMyReaction(note.renote, this.user.id);
				note.renote.myReaction = myRenoteReaction;
			}
		}

		this.send('note', note);
	}

	@bindThis
	public dispose() {
		// Unsubscribe events
		this.subscriber.off('notesStream', this.onNote);
	}
}
