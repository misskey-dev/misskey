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
import type { OnModuleInit } from '@nestjs/common';
import type { } from '@/models/Blocking.js';
import type { MiUser } from '@/models/User.js';
import type { MiNoteReaction } from '@/models/NoteReaction.js';
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

	constructor(
		private moduleRef: ModuleRef,

		@Inject(DI.noteReactionsRepository)
		private noteReactionsRepository: NoteReactionsRepository,

		//private userEntityService: UserEntityService,
		//private noteEntityService: NoteEntityService,
		//private reactionService: ReactionService,
		//private idService: IdService,
	) {
	}

	onModuleInit() {
		this.userEntityService = this.moduleRef.get('UserEntityService');
		this.noteEntityService = this.moduleRef.get('NoteEntityService');
		this.reactionService = this.moduleRef.get('ReactionService');
		this.idService = this.moduleRef.get('IdService');
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
		const _users = reactions.map(({ user, userId }) => user ?? userId);
		const _userMap = await this.userEntityService.packMany(_users, me)
			.then(users => new Map(users.map(u => [u.id, u])));
		return Promise.all(reactions.map(reaction => this.pack(reaction, me, opts, { packedUser: _userMap.get(reaction.userId) })));
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
		const opts = Object.assign({
		}, options);
		const _users = reactions.map(({ user, userId }) => user ?? userId);
		const _userMap = await this.userEntityService.packMany(_users, me)
			.then(users => new Map(users.map(u => [u.id, u])));
		return Promise.all(reactions.map(reaction => this.packWithNote(reaction, me, opts, { packedUser: _userMap.get(reaction.userId) })));
	}
}
