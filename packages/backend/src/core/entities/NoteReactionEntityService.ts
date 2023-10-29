/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
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
		options?: {
			withNote: boolean;
		},
	): Promise<Packed<'NoteReaction'>> {
		const opts = Object.assign({
			withNote: false,
		}, options);

		const reaction = typeof src === 'object' ? src : await this.noteReactionsRepository.findOneByOrFail({ id: src });

		return {
			id: reaction.id,
			createdAt: this.idService.parse(reaction.id).date.toISOString(),
			user: await this.userEntityService.pack(reaction.user ?? reaction.userId, me),
			type: this.reactionService.convertLegacyReaction(reaction.reaction),
			...(opts.withNote ? {
				note: await this.noteEntityService.pack(reaction.note ?? reaction.noteId, me),
			} : {}),
		};
	}
}
