/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { NoteReactionsRepository } from '@/models/_.js';
import type { Packed } from '@/misc/json-schema.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { CacheService } from '@/core/CacheService.js';
import type { MiUser } from '@/models/User.js';
import type { MiNoteReaction } from '@/models/NoteReaction.js';
import type { OnModuleInit } from '@nestjs/common';
import type { } from '@/models/Blocking.js';
import type { ReactionService } from '../ReactionService.js';
import type { UserEntityService } from './UserEntityService.js';
import type { NoteEntityService } from './NoteEntityService.js';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class NoteReactionEntityService implements OnModuleInit {
	private userEntityService: UserEntityService;
	private noteEntityService: NoteEntityService;
	private reactionService: ReactionService;
	private idService: IdService;
	private cacheService: CacheService;

	constructor(
		private moduleRef: ModuleRef,

		@Inject(DI.noteReactionsRepository)
		private noteReactionsRepository: NoteReactionsRepository,

		//private userEntityService: UserEntityService,
		//private noteEntityService: NoteEntityService,
		//private reactionService: ReactionService,
		//private idService: IdService,
		//private cacheService: CacheService,
	) {
	}

	onModuleInit() {
		this.userEntityService = this.moduleRef.get('UserEntityService');
		this.noteEntityService = this.moduleRef.get('NoteEntityService');
		this.reactionService = this.moduleRef.get('ReactionService');
		this.idService = this.moduleRef.get('IdService');
		this.cacheService = this.moduleRef.get('CacheService');
	}

	@bindThis
	public async pack(
		src: MiNoteReaction['id'] | MiNoteReaction,
		me?: { id: MiUser['id'] } | null | undefined,
		options?: object,
		hints?: {
			packedUser?: Packed<'UserLite'>
		},
	): Promise<Packed<'NoteReaction'>> {
		const _opts = Object.assign({
		}, options);

		const reaction = typeof src === 'object' ? src : await this.noteReactionsRepository.findOneByOrFail({ id: src });

		return {
			id: reaction.id,
			createdAt: this.idService.parse(reaction.id).date.toISOString(),
			user: hints?.packedUser ?? await this.userEntityService.pack(reaction.user ?? reaction.userId, me),
			type: this.reactionService.convertLegacyReaction(reaction.reaction),
		};
	}

	@bindThis
	public async packMany(
		reactions: MiNoteReaction[],
		me?: { id: MiUser['id'] } | null | undefined,
		options?: object,
	): Promise<Packed<'NoteReaction'>[]> {
		const opts = Object.assign({
		}, options);
		const meId = me ? me.id : null;

		// ログインユーザーがいる場合のみ、ブロック・ミュートリストを取得
		let muted: Set<string> | null = null;
		let blocked: Set<string> | null = null;
		let newReactions: MiNoteReaction[] = reactions;

		if (meId) {
			[blocked, muted] = await Promise.all([
				this.cacheService.userBlockingCache.fetch(meId), // 自分がブロックしたユーザー
				this.cacheService.userMutingsCache.fetch(meId), // 自分がミュートしたユーザー
			]);

			const filteredReactions = reactions.filter(reaction => {
				const isBlockedOrMuted = blocked!.has(reaction.userId) || muted!.has(reaction.userId);
				return !isBlockedOrMuted;
			});

			newReactions = filteredReactions;
		}
		const _users = newReactions.map(({ user, userId }) => user ?? userId);
		const _userMap = await this.userEntityService.packMany(_users, me)
			.then(users => new Map(users.map(u => [u.id, u])));
		return Promise.all(newReactions.map(reaction => this.pack(reaction, me, opts, { packedUser: _userMap.get(reaction.userId) })));
	}

	@bindThis
	public async packWithNote(
		src: MiNoteReaction['id'] | MiNoteReaction,
		me?: { id: MiUser['id'] } | null | undefined,
		options?: object,
		hints?: {
			packedUser?: Packed<'UserLite'>
		},
	): Promise<Packed<'NoteReactionWithNote'>> {
		const _opts = Object.assign({
		}, options);

		const reaction = typeof src === 'object' ? src : await this.noteReactionsRepository.findOneByOrFail({ id: src });
		const meId = me ? me.id : null;

		// ログインユーザーがいる場合のみ、ブロック・ミュートリストを取得
		let muted: Set<string> | null = null;
		let blocked: Set<string> | null = null;

		if (meId) {
			[blocked, muted] = await Promise.all([
				this.cacheService.userBlockingCache.fetch(meId), // 自分がブロックしたユーザー
				this.cacheService.userMutingsCache.fetch(meId), // 自分がミュートしたユーザー
			]);

			if (reaction.userId && (blocked?.has(reaction.userId) || muted?.has(reaction.userId))) {
				return {} as any; // ミュート・ブロックされている場合は空オブジェクトを返す
			}
		}

		return {
			id: reaction.id,
			createdAt: this.idService.parse(reaction.id).date.toISOString(),
			user: hints?.packedUser ?? await this.userEntityService.pack(reaction.user ?? reaction.userId, me),
			type: this.reactionService.convertLegacyReaction(reaction.reaction),
			note: await this.noteEntityService.pack(reaction.note ?? reaction.noteId, me),
		};
	}

	@bindThis
	public async packManyWithNote(
		reactions: MiNoteReaction[],
		me?: { id: MiUser['id'] } | null | undefined,
		options?: object,
	): Promise<Packed<'NoteReactionWithNote'>[]> {
		const opts = Object.assign({}, options);

		// キャッシュからミュート・ブロック情報を取得
		const blocked = me ? await this.cacheService.userBlockedCache.fetch(me.id) : null;
		const muted = me ? await this.cacheService.userMutingsCache.fetch(me.id) : null;

		// ミュート・ブロックされたユーザーのリアクションを除外
		const filteredReactions = reactions.filter(reaction => {
			if (!me) return true;
			return !(blocked?.has(reaction.userId) || muted?.has(reaction.userId));
		});

		const _users = filteredReactions.map(({ user, userId }) => user ?? userId);
		const _userMap = await this.userEntityService.packMany(_users, me)
			.then(users => new Map(users.map(u => [u.id, u])));

		return Promise.all(filteredReactions.map(reaction =>
			this.packWithNote(reaction, me, opts, { packedUser: _userMap.get(reaction.userId) }),
		));
	}
}
