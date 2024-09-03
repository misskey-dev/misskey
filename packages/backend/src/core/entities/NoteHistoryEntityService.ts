/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { Packed } from '@/misc/json-schema.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { MiUser } from '@/models/User.js';
import type { MiNote } from '@/models/Note.js';
import type { UsersRepository, NotesRepository, NoteHistoriesRepository, FollowingsRepository, PollsRepository, PollVotesRepository, MiNoteHistory } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import type { OnModuleInit } from '@nestjs/common';
import type { CustomEmojiService } from '../CustomEmojiService.js';
import type { ReactionService } from '../ReactionService.js';
import type { UserEntityService } from './UserEntityService.js';
import type { DriveFileEntityService } from './DriveFileEntityService.js';
import type { NoteEntityService } from './NoteEntityService.js';

@Injectable()
export class NoteHistoryEntityService implements OnModuleInit {
	private userEntityService: UserEntityService;
	private driveFileEntityService: DriveFileEntityService;
	private customEmojiService: CustomEmojiService;
	private reactionService: ReactionService;
	private noteEntityService: NoteEntityService;
	private idService: IdService;

	constructor(
		private moduleRef: ModuleRef,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.noteHistoriesRepository)
		private noteHistoriesRepository: NoteHistoriesRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		@Inject(DI.pollsRepository)
		private pollsRepository: PollsRepository,

		@Inject(DI.pollVotesRepository)
		private pollVotesRepository: PollVotesRepository,
	) {
	}

	onModuleInit() {
		this.userEntityService = this.moduleRef.get('UserEntityService');
		this.driveFileEntityService = this.moduleRef.get('DriveFileEntityService');
		this.customEmojiService = this.moduleRef.get('CustomEmojiService');
		this.reactionService = this.moduleRef.get('ReactionService');
		this.noteEntityService = this.moduleRef.get('NoteEntityService');
		this.idService = this.moduleRef.get('IdService');
	}

	@bindThis
	public async pack(
		src: MiNoteHistory['id'],
		me?: { id: MiUser['id'] } | null | undefined,
		options?: {
			detail?: boolean;
			skipHide?: boolean;
			withReactionAndUserPairCache?: boolean;
			_hint_?: {
				packedFiles: Map<MiNote['fileIds'][number], Packed<'DriveFile'> | null>;
				packedUsers: Map<MiUser['id'], Packed<'UserLite'>>
			};
		},
	): Promise<Packed<'NoteHistory'>> {
		const opts = Object.assign({
			detail: true,
			skipHide: false,
			withReactionAndUserPairCache: false,
		}, options);
		const targetHistory = await this.noteHistoriesRepository.findOneByOrFail({ id: src });
		const targetNote = await this.notesRepository.findOneByOrFail({ id: targetHistory.targetId });
		const meId = me ? me.id : null;
		if (!(await this.noteEntityService.isVisibleForMe(targetNote, meId))) {
			throw new Error('Note is not visible for me');
		}
		const host = targetNote.userHost;

		const packedFiles = options?._hint_?.packedFiles ?? new Map();

		const packed: Packed<'NoteHistory'> = await awaitAll({
			id: targetHistory.id,
			targetId: targetHistory.targetId,
			createdAt: this.idService.parse(targetHistory.id).date.toISOString(),
			text: targetHistory.text,
			cw: targetHistory.cw,
			emojis: host != null ? this.customEmojiService.populateEmojis(targetHistory.emojis, host) : undefined,
			tags: targetHistory.tags.length > 0 ? targetHistory.tags : undefined,
			fileIds: targetHistory.fileIds,
			files: packedFiles != null ? this.noteEntityService.packAttachedFiles(targetHistory.fileIds, packedFiles) : this.driveFileEntityService.packManyByIds(targetHistory.fileIds),
			mentions: targetHistory.mentions.length > 0 ? targetHistory.mentions : undefined,

			...(opts.detail ? {
				poll: targetHistory.hasPoll ? this.noteEntityService.populatePoll(targetNote, meId) : undefined,
			} : {}),
		});
		return packed;
	}

	@bindThis
	public async packMany(
		noteHistories: MiNoteHistory[],
		me?: { id: MiUser['id'] } | null | undefined,
		options?: {
			detail?: boolean;
			skipHide?: boolean;
		},
	) {
		if (noteHistories.length === 0) return [];
		const targetNotes = await this.notesRepository.findBy({ id: In(noteHistories.map(n => n.targetId)) });
		await this.customEmojiService.prefetchEmojis(this.noteEntityService.aggregateNoteEmojis(targetNotes));
		const fileIds: string[] = targetNotes.map(n => [n.fileIds, n.renote?.fileIds, n.reply?.fileIds]).flat(2).filter((x): x is string => x != null);
		const packedFiles = fileIds.length > 0 ? await this.driveFileEntityService.packManyByIdsMap(fileIds) : new Map();
		const users = [
			...targetNotes.map(({ user, userId }) => user ?? userId),
			...targetNotes.map(({ replyUserId }) => replyUserId).filter((x): x is string => x != null),
			...targetNotes.map(({ renoteUserId }) => renoteUserId).filter((x): x is string => x != null),
		];
		const packedUsers = await this.userEntityService.packMany(users, me)
			.then(users => new Map(users.map(u => [u.id, u])));

		return await Promise.all(noteHistories.map(nh => this.pack(nh.id, me, {
			...options,
			_hint_: {
				packedFiles,
				packedUsers,
			},
		})));
	}
}
