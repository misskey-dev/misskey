/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import type { Packed } from '@/misc/json-schema.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { bindThis } from '@/decorators.js';
import { RoleService } from '@/core/RoleService.js';
import { isRenotePacked, isQuotePacked } from '@/misc/is-renote.js';
import type { JsonObject } from '@/misc/json-value.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import type { ChannelFollowingsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import Channel, { type MiChannelService } from '../channel.js';

class YamiTimelineChannel extends Channel {
	public readonly chName = 'yamiTimeline';
	public static shouldShare = false;
	public static requireCredential = true as const;
	public static kind = 'read:account';
	private withRenotes: boolean;
	private withFiles: boolean;
	private showYamiNonFollowingPublicNotes: boolean;
	private showYamiFollowingNotes: boolean;
	private following: Record<string, { id: string; withReplies: boolean }> = {};
	private followingChannels: Set<string> = new Set();

	constructor(
		private noteEntityService: NoteEntityService,
		private roleService: RoleService,
		private userFollowingService: UserFollowingService,
		private channelFollowingRepository: ChannelFollowingsRepository,
		id: string,
		connection: Channel['connection'],
	) {
		super(id, connection);
	}

	@bindThis
	public async init(params: JsonObject): Promise<void> {
		const policies = await this.roleService.getUserPolicies(this.user ? this.user.id : null);
		if (!policies.yamiTlAvailable) return;

		this.withRenotes = !!(params.withRenotes ?? true);
		this.withFiles = !!(params.withFiles ?? false);
		this.showYamiNonFollowingPublicNotes = !!(params.showYamiNonFollowingPublicNotes ?? true);
		this.showYamiFollowingNotes = !!(params.showYamiFollowingNotes ?? true);

		await this.refreshFollowingStatus();

		// フォロー状態変化のイベント購読
		this.subscriber.on('follow', this.onFollow);
		this.subscriber.on('unfollow', this.onUnfollow);

		// ノートストリームの購読
		this.subscriber.off('notesStream', this.onNote); // 念のため登録解除
		this.subscriber.on('notesStream', this.onNote);

		// デバッグ用リスナーを削除
	}

	@bindThis
	private async refreshFollowingStatus(): Promise<void> {
		const followings = await this.userFollowingService.getFollowees(this.user!.id);
		this.following = {};
		for (const following of followings) {
			this.following[following.followeeId] = { id: following.followeeId, withReplies: true };
		}

		// チャンネルフォロー情報の初期化
		const channelFollowings = await this.channelFollowingRepository.findBy({
			followerId: this.user!.id,
		});
		this.followingChannels.clear();
		for (const following of channelFollowings) {
			this.followingChannels.add(following.followeeId);
		}
	}

	@bindThis
	private async onNote(note: Packed<'Note'>) {
		try {
			// やみモードの投稿のみ表示する
			if (!note.isNoteInYamiMode) return;

			const isMe = this.user!.id === note.userId;

			// 【基本フィルタリング】
			// 1. 自分がやみモードでない場合は自分の投稿だけ表示
			if (!isMe && !this.user!.isInYamiMode) return;

			// 2. 添付ファイル条件
			if (this.withFiles && (note.fileIds == null || note.fileIds.length === 0)) return;

			// 3. リノート条件 (純粋なリノート)
			if (!this.withRenotes && isRenotePacked(note) && !isQuotePacked(note) && !note.text && !note.fileIds?.length) return;

			// 【表示条件判定】- 明確に分離
			let shouldDisplay = false;

			// 自分の投稿は常に表示
			if (isMe) {
				shouldDisplay = true;
			}
			// 自分宛てのダイレクト投稿は常に表示
			else if (note.visibility === 'specified' && note.visibleUserIds?.includes(this.user!.id)) {
				shouldDisplay = true;
			}
			// フォロー中のユーザーの投稿 - showYamiFollowingNotesで制御
			else if (Object.hasOwn(this.following, note.userId)) {
				shouldDisplay = this.showYamiFollowingNotes;
			}
			// フォローしていないユーザーのパブリック投稿 - showYamiNonFollowingPublicNotesで制御
			else if (note.visibility === 'public' && note.userHost === null) {
				shouldDisplay = this.showYamiNonFollowingPublicNotes;
			}

			// どの条件にも当てはまらなければ表示しない
			if (!shouldDisplay) return;

			// 【チャンネル投稿の追加チェック】
			if (note.channelId) {
				// チャンネルをフォローしていなければ表示しない
				if (!this.followingChannels.has(note.channelId)) return;

				// propagateToTimelinesがfalseで、自分の投稿でもない場合は表示しない
				if (note.channel && !note.channel.propagateToTimelines && !isMe) return;
			}

			// 【リプライの特別処理】
			if (note.reply) {
				const reply = note.reply;
				// フォロー中ユーザーの返信で、withRepliesがtrueの場合
				if (Object.hasOwn(this.following, note.userId) && this.following[note.userId].withReplies) {
					// フォローしていないユーザーのフォロワー限定投稿への返信は表示しない
					if (reply.visibility === 'followers' && !Object.hasOwn(this.following, reply.userId) && reply.userId !== this.user!.id) return;
				} else {
					// それ以外のユーザーからの返信は、以下の場合のみ表示:
					// 1. 自分への返信、2. 自分の返信、3. 投稿者自身への返信
					if (reply.userId !== this.user!.id && !isMe && reply.userId !== note.userId) return;
				}
			}

			// 【リノート先の確認】
			if (isRenotePacked(note) && !isQuotePacked(note) && note.renote) {
				if (note.renote.reply) {
					const reply = note.renote.reply;
					// フォローしていないユーザーのフォロワー限定投稿への返信のリノートは表示しない
					if (reply.visibility === 'followers' && !Object.hasOwn(this.following, reply.userId) && reply.userId !== this.user!.id) return;
				}
			}

			// ミュート・ブロックのチェック
			if (this.isNoteMutedOrBlocked(note)) return;

			// リアクション情報の設定
			if (this.user && isRenotePacked(note) && !isQuotePacked(note)) {
				if (note.renote && Object.keys(note.renote.reactions).length > 0) {
					const myRenoteReaction = await this.noteEntityService.populateMyReaction(note.renote, this.user.id);
					note.renote.myReaction = myRenoteReaction;
				}
			}

			this.connection.cacheNote(note);
			this.send('note', note);
		} catch (err) {
			console.error('YamiTL onNote error:', err);
		}
	}

	@bindThis
	private onFollow(payload) {
		if (payload.followerId === this.user!.id) {
			this.following[payload.followeeId] = { id: payload.followeeId, withReplies: true };
		}
	}

	@bindThis
	private onUnfollow(payload) {
		if (payload.followerId === this.user!.id) {
			delete this.following[payload.followeeId];
		}
	}

	@bindThis
	public dispose() {
		// Unsubscribe events
		this.subscriber.off('notesStream', this.onNote);
		this.subscriber.off('follow', this.onFollow);
		this.subscriber.off('unfollow', this.onUnfollow);
	}
}

@Injectable()
export class YamiTimelineChannelService implements MiChannelService<true> {
	public readonly shouldShare = YamiTimelineChannel.shouldShare;
	public readonly requireCredential = YamiTimelineChannel.requireCredential;
	public readonly kind = YamiTimelineChannel.kind;

	constructor(
		private noteEntityService: NoteEntityService,
		private roleService: RoleService,
		private userFollowingService: UserFollowingService,
		@Inject(DI.channelFollowingsRepository)
		private channelFollowingRepository: ChannelFollowingsRepository,
	) {
	}

	@bindThis
	public create(id: string, connection: Channel['connection']): YamiTimelineChannel {
		return new YamiTimelineChannel(
			this.noteEntityService,
			this.roleService,
			this.userFollowingService,
			this.channelFollowingRepository,
			id,
			connection,
		);
	}
}
