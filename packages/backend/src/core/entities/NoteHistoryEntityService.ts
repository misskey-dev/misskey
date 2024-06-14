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
import type { UsersRepository, NotesRepository, NoteHistoryRepository, FollowingsRepository, PollsRepository, PollVotesRepository, MiNoteHistory } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { isNotNull } from '@/misc/is-not-null.js';
import { IdService } from '@/core/IdService.js';
import type { OnModuleInit } from '@nestjs/common';
import type { CustomEmojiService } from '../CustomEmojiService.js';
import type { ReactionService } from '../ReactionService.js';
import type { UserEntityService } from './UserEntityService.js';
import type { DriveFileEntityService } from './DriveFileEntityService.js';

@Injectable()
export class NoteHistoryEntityService implements OnModuleInit {
	private userEntityService: UserEntityService;
	private driveFileEntityService: DriveFileEntityService;
	private customEmojiService: CustomEmojiService;
	private reactionService: ReactionService;
	private idService: IdService;

	constructor(
		private moduleRef: ModuleRef,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.noteHistoryRepository)
		private noteHistoryRepository: NoteHistoryRepository,

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
		this.idService = this.moduleRef.get('IdService');
	}

	@bindThis
	private async populatePoll(note: MiNote, meId: MiUser['id'] | null) {
		const poll = await this.pollsRepository.findOneByOrFail({ noteId: note.id });
		const choices = poll.choices.map(c => ({
			text: c,
			votes: poll.votes[poll.choices.indexOf(c)],
			isVoted: false,
		}));

		if (meId) {
			if (poll.multiple) {
				const votes = await this.pollVotesRepository.findBy({
					userId: meId,
					noteId: note.id,
				});

				const myChoices = votes.map(v => v.choice);
				for (const myChoice of myChoices) {
					choices[myChoice].isVoted = true;
				}
			} else {
				const vote = await this.pollVotesRepository.findOneBy({
					userId: meId,
					noteId: note.id,
				});

				if (vote) {
					choices[vote.choice].isVoted = true;
				}
			}
		}

		return {
			multiple: poll.multiple,
			expiresAt: poll.expiresAt?.toISOString() ?? null,
			choices,
		};
	}

	@bindThis
	public async isVisibleForMe(note: MiNote, meId: MiUser['id'] | null): Promise<boolean> {
		// This code must always be synchronized with the checks in generateVisibilityQuery.
		// visibility が specified かつ自分が指定されていなかったら非表示
		if (note.visibility === 'specified') {
			if (meId == null) {
				return false;
			} else if (meId === note.userId) {
				return true;
			} else {
				// 指定されているかどうか
				return note.visibleUserIds.some((id: any) => meId === id);
			}
		}

		// visibility が followers かつ自分が投稿者のフォロワーでなかったら非表示
		if (note.visibility === 'followers') {
			if (meId == null) {
				return false;
			} else if (meId === note.userId) {
				return true;
			} else if (note.reply && (meId === note.reply.userId)) {
				// 自分の投稿に対するリプライ
				return true;
			} else if (note.mentions && note.mentions.some(id => meId === id)) {
				// 自分へのメンション
				return true;
			} else {
				// フォロワーかどうか
				const [following, user] = await Promise.all([
					this.followingsRepository.count({
						where: {
							followeeId: note.userId,
							followerId: meId,
						},
						take: 1,
					}),
					this.usersRepository.findOneByOrFail({ id: meId }),
				]);

				/* If we know the following, everyhting is fine.

				But if we do not know the following, it might be that both the
				author of the note and the author of the like are remote users,
				in which case we can never know the following. Instead we have
				to assume that the users are following each other.
				*/
				return following > 0 || (note.userHost != null && user.host != null);
			}
		}

		return true;
	}

	@bindThis
	public async packAttachedFiles(fileIds: MiNote['fileIds'], packedFiles: Map<MiNote['fileIds'][number], Packed<'DriveFile'> | null>): Promise<Packed<'DriveFile'>[]> {
		const missingIds = [];
		for (const id of fileIds) {
			if (!packedFiles.has(id)) missingIds.push(id);
		}
		if (missingIds.length) {
			const additionalMap = await this.driveFileEntityService.packManyByIdsMap(missingIds);
			for (const [k, v] of additionalMap) {
				packedFiles.set(k, v);
			}
		}
		return fileIds.map(id => packedFiles.get(id)).filter(isNotNull);
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
		const targetHistory = await this.noteHistoryRepository.findOneByOrFail({ id: src });
		const targetNote = await this.notesRepository.findOneByOrFail({ id: targetHistory.targetId });
		const meId = me ? me.id : null;
		if (!(await this.isVisibleForMe(targetNote, meId))) {
			throw new Error('Note is not visible for me');
		}
		const host = targetNote.userHost;

		const packedFiles = options?._hint_?.packedFiles;

		const packed: Packed<'NoteHistory'> = await awaitAll({
			id: targetHistory.id,
			targetId: targetHistory.targetId,
			createdAt: this.idService.parse(targetHistory.id).date.toISOString(),
			text: targetHistory.text,
			cw: targetHistory.cw,
			emojis: host != null ? this.customEmojiService.populateEmojis(targetHistory.emojis, host) : undefined,
			tags: targetHistory.tags.length > 0 ? targetHistory.tags : undefined,
			fileIds: targetHistory.fileIds,
			files: packedFiles != null ? this.packAttachedFiles(targetHistory.fileIds, packedFiles) : this.driveFileEntityService.packManyByIds(targetHistory.fileIds),
			mentions: targetHistory.mentions.length > 0 ? targetHistory.mentions : undefined,

			...(opts.detail ? {
				poll: targetHistory.hasPoll ? this.populatePoll(targetNote, meId) : undefined,
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
		await this.customEmojiService.prefetchEmojis(this.aggregateNoteEmojis(targetNotes));
		const fileIds = targetNotes.map(n => [n.fileIds, n.renote?.fileIds, n.reply?.fileIds]).flat(2).filter(isNotNull);
		const packedFiles = fileIds.length > 0 ? await this.driveFileEntityService.packManyByIdsMap(fileIds) : new Map();
		const users = [
			...targetNotes.map(({ user, userId }) => user ?? userId),
			...targetNotes.map(({ replyUserId }) => replyUserId).filter(isNotNull),
			...targetNotes.map(({ renoteUserId }) => renoteUserId).filter(isNotNull),
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

	@bindThis
	public aggregateNoteEmojis(notes: MiNote[]) {
		let emojis: { name: string | null; host: string | null; }[] = [];
		for (const note of notes) {
			emojis = emojis.concat(note.emojis
				.map(e => this.customEmojiService.parseEmojiStr(e, note.userHost)));
			if (note.renote) {
				emojis = emojis.concat(note.renote.emojis
					.map(e => this.customEmojiService.parseEmojiStr(e, note.renote!.userHost)));
				if (note.renote.user) {
					emojis = emojis.concat(note.renote.user.emojis
						.map(e => this.customEmojiService.parseEmojiStr(e, note.renote!.userHost)));
				}
			}
			const customReactions = Object.keys(note.reactions).map(x => this.reactionService.decodeReaction(x)).filter(x => x.name != null) as typeof emojis;
			emojis = emojis.concat(customReactions);
			if (note.user) {
				emojis = emojis.concat(note.user.emojis
					.map(e => this.customEmojiService.parseEmojiStr(e, note.userHost)));
			}
		}
		return emojis.filter(x => x.name != null && x.host != null) as { name: string; host: string; }[];
	}
}
