/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import type { noteVisibilities, noteReactionAcceptances } from '@/types.js';
import { DI } from '@/di-symbols.js';
import type { MiNoteDraft, NoteDraftsRepository, MiNote, MiDriveFile, MiChannel, UsersRepository, DriveFilesRepository, NotesRepository, BlockingsRepository, ChannelsRepository } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { RoleService } from '@/core/RoleService.js';
import { IdService } from '@/core/IdService.js';
import type { MiLocalUser, MiUser } from '@/models/User.js';
import { IPoll } from '@/models/Poll.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { isRenote, isQuote } from '@/misc/is-renote.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';

export type NoteDraftOptions = {
	replyId?: MiNote['id'] | null;
	renoteId?: MiNote['id'] | null;
	text?: string | null;
	cw?: string | null;
	localOnly?: boolean | null;
	reactionAcceptance?: typeof noteReactionAcceptances[number];
	visibility?: typeof noteVisibilities[number];
	fileIds?: MiDriveFile['id'][];
	visibleUserIds?: MiUser['id'][];
	hashtag?: string;
	channelId?: MiChannel['id'] | null;
	poll?: (IPoll & { expiredAfter?: number | null }) | null;
};

@Injectable()
export class NoteDraftService {
	constructor(
		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		@Inject(DI.noteDraftsRepository)
		private noteDraftsRepository: NoteDraftsRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.channelsRepository)
		private channelsRepository: ChannelsRepository,

		private roleService: RoleService,
		private idService: IdService,
		private noteEntityService: NoteEntityService,
	) {
	}

	@bindThis
	public async get(me: MiLocalUser, draftId: MiNoteDraft['id']): Promise<MiNoteDraft | null> {
		const draft = await this.noteDraftsRepository.findOneBy({
			id: draftId,
			userId: me.id,
		});

		return draft;
	}

	@bindThis
	public async create(me: MiLocalUser, data: NoteDraftOptions): Promise<MiNoteDraft> {
		//#region check draft limit

		const currentCount = await this.noteDraftsRepository.countBy({
			userId: me.id,
		});
		if (currentCount >= (await this.roleService.getUserPolicies(me.id)).noteDraftLimit) {
			throw new IdentifiableError('9ee33bbe-fde3-4c71-9b51-e50492c6b9c8', 'Too many drafts');
		}
		//#endregion

		if (data.poll) {
			if (typeof data.poll.expiresAt === 'number') {
				if (data.poll.expiresAt < Date.now()) {
					throw new IdentifiableError('04da457d-b083-4055-9082-955525eda5a5', 'Cannot create expired poll');
				}
			} else if (typeof data.poll.expiredAfter === 'number') {
				data.poll.expiresAt = new Date(Date.now() + data.poll.expiredAfter);
			}
		}

		const appliedDraft = await this.checkAndSetDraftNoteOptions(me, this.noteDraftsRepository.create(), data);

		appliedDraft.id = this.idService.gen();
		appliedDraft.userId = me.id;
		const draft = this.noteDraftsRepository.save(appliedDraft);

		return draft;
	}

	@bindThis
	public async update(me: MiLocalUser, draftId: MiNoteDraft['id'], data: NoteDraftOptions): Promise<MiNoteDraft> {
		const draft = await this.noteDraftsRepository.findOneBy({
			id: draftId,
			userId: me.id,
		});

		if (draft == null) {
			throw new IdentifiableError('49cd6b9d-848e-41ee-b0b9-adaca711a6b1', 'No such note draft');
		}

		if (data.poll) {
			if (typeof data.poll.expiresAt === 'number') {
				if (data.poll.expiresAt < Date.now()) {
					throw new IdentifiableError('04da457d-b083-4055-9082-955525eda5a5', 'Cannot create expired poll');
				}
			} else if (typeof data.poll.expiredAfter === 'number') {
				data.poll.expiresAt = new Date(Date.now() + data.poll.expiredAfter);
			}
		}

		const appliedDraft = await this.checkAndSetDraftNoteOptions(me, draft, data);

		return await this.noteDraftsRepository.save(appliedDraft);
	}

	@bindThis
	public async delete(me: MiLocalUser, draftId: MiNoteDraft['id']): Promise<void> {
		const draft = await this.noteDraftsRepository.findOneBy({
			id: draftId,
			userId: me.id,
		});

		if (draft == null) {
			throw new IdentifiableError('49cd6b9d-848e-41ee-b0b9-adaca711a6b1', 'No such note draft');
		}

		await this.noteDraftsRepository.delete(draft.id);
	}

	@bindThis
	public async getDraft(me: MiLocalUser, draftId: MiNoteDraft['id']): Promise<MiNoteDraft> {
		const draft = await this.noteDraftsRepository.findOneBy({
			id: draftId,
			userId: me.id,
		});

		if (draft == null) {
			throw new IdentifiableError('49cd6b9d-848e-41ee-b0b9-adaca711a6b1', 'No such note draft');
		}

		return draft;
	}

	// 関連エンティティを取得し紐づける部分を共通化する
	@bindThis
	public async checkAndSetDraftNoteOptions(
		me: MiLocalUser,
		draft: MiNoteDraft,
		data: NoteDraftOptions,
	): Promise<MiNoteDraft> {
		data.visibility ??= 'public';
		data.localOnly ??= false;
		if (data.reactionAcceptance === undefined) data.reactionAcceptance = null;
		if (data.channelId != null) {
			data.visibility = 'public';
			data.visibleUserIds = [];
			data.localOnly = true;
		}

		let appliedDraft = draft;

		//#region visibleUsers
		let visibleUsers: MiUser[] = [];
		if (data.visibleUserIds != null) {
			visibleUsers = await this.usersRepository.findBy({
				id: In(data.visibleUserIds),
			});
		}
		//#endregion

		//#region files
		let files: MiDriveFile[] = [];
		const fileIds = data.fileIds ?? null;
		if (fileIds != null) {
			files = await this.driveFilesRepository.createQueryBuilder('file')
				.where('file.userId = :userId AND file.id IN (:...fileIds)', {
					userId: me.id,
					fileIds: fileIds,
				})
				.orderBy('array_position(ARRAY[:...fileIds], "id"::text)')
				.setParameters({ fileIds })
				.getMany();

			if (files.length !== fileIds.length) {
				throw new IdentifiableError('b6992544-63e7-67f0-fa7f-32444b1b5306', 'No such drive file');
			}
		}
		//#endregion

		//#region renote
		let renote: MiNote | null = null;
		if (data.renoteId != null) {
			renote = await this.notesRepository.findOneBy({ id: data.renoteId });

			if (renote == null) {
				throw new IdentifiableError('64929870-2540-4d11-af41-3b484d78c956', 'No such renote');
			} else if (isRenote(renote) && !isQuote(renote)) {
				throw new IdentifiableError('76cc5583-5a14-4ad3-8717-0298507e32db', 'Cannot renote');
			}

			// Check blocking
			if (renote.userId !== me.id) {
				const blockExist = await this.blockingsRepository.exists({
					where: {
						blockerId: renote.userId,
						blockeeId: me.id,
					},
				});
				if (blockExist) {
					throw new IdentifiableError('075ca298-e6e7-485a-b570-51a128bb5168', 'You have been blocked by the user');
				}
			}

			if (renote.visibility === 'followers' && renote.userId !== me.id) {
				// 他人のfollowers noteはreject
				throw new IdentifiableError('81eb8188-aea1-4e35-9a8f-3334a3be9855', 'Cannot Renote Due to Visibility');
			} else if (renote.visibility === 'specified') {
				// specified / direct noteはreject
				throw new IdentifiableError('81eb8188-aea1-4e35-9a8f-3334a3be9855', 'Cannot Renote Due to Visibility');
			}

			if (renote.channelId && renote.channelId !== data.channelId) {
				// チャンネルのノートに対しリノート要求がきたとき、チャンネル外へのリノート可否をチェック
				// リノートのユースケースのうち、チャンネル内→チャンネル外は少数だと考えられるため、JOINはせず必要な時に都度取得する
				const renoteChannel = await this.channelsRepository.findOneBy({ id: renote.channelId });
				if (renoteChannel == null) {
					// リノートしたいノートが書き込まれているチャンネルがない
					throw new IdentifiableError('6815399a-6f13-4069-b60d-ed5156249d12', 'No such channel');
				} else if (!renoteChannel.allowRenoteToExternal) {
					// リノート作成のリクエストだが、対象チャンネルがリノート禁止だった場合
					throw new IdentifiableError('ed1952ac-2d26-4957-8b30-2deda76bedf7', 'Cannot Renote to External');
				}
			}
		}
		//#endregion

		//#region reply
		let reply: MiNote | null = null;
		if (data.replyId != null) {
			// Fetch reply
			reply = await this.notesRepository.findOneBy({ id: data.replyId });

			if (reply == null) {
				throw new IdentifiableError('c4721841-22fc-4bb7-ad3d-897ef1d375b5', 'No such reply');
			} else if (isRenote(reply) && !isQuote(reply)) {
				throw new IdentifiableError('e6c10b57-2c09-4da3-bd4d-eda05d51d140', 'Cannot reply To Pure Renote');
			} else if (!await this.noteEntityService.isVisibleForMe(reply, me.id)) {
				throw new IdentifiableError('593c323c-6b6a-4501-a25c-2f36bd2a93d6', 'Cannot reply To Invisible Note');
			} else if (reply.visibility === 'specified' && data.visibility !== 'specified') {
				throw new IdentifiableError('215dbc76-336c-4d2a-9605-95766ba7dab0', 'Cannot reply To Specified Note With Extended Visibility');
			}

			// Check blocking
			if (reply.userId !== me.id) {
				const blockExist = await this.blockingsRepository.exists({
					where: {
						blockerId: reply.userId,
						blockeeId: me.id,
					},
				});
				if (blockExist) {
					throw new IdentifiableError('075ca298-e6e7-485a-b570-51a128bb5168', 'You have been blocked by the user');
				}
			}
		}
		//#endregion

		//#region channel
		let channel: MiChannel | null = null;
		if (data.channelId != null) {
			channel = await this.channelsRepository.findOneBy({ id: data.channelId, isArchived: false });

			if (channel == null) {
				throw new IdentifiableError('6815399a-6f13-4069-b60d-ed5156249d12', 'No such channel');
			}
		}
		//#endregion

		appliedDraft = {
			...appliedDraft,
			visibility: data.visibility,
			cw: data.cw ?? null,
			fileIds: fileIds ?? [],
			replyId: data.replyId ?? null,
			renoteId: data.renoteId ?? null,
			channelId: data.channelId ?? null,
			text: data.text ?? null,
			hashtag: data.hashtag ?? null,
			hasPoll: data.poll != null,
			pollChoices: data.poll ? data.poll.choices : [],
			pollMultiple: data.poll ? data.poll.multiple : false,
			pollExpiresAt: data.poll ? data.poll.expiresAt : null,
			pollExpiredAfter: data.poll ? data.poll.expiredAfter ?? null : null,
			visibleUserIds: data.visibleUserIds ?? [],
			localOnly: data.localOnly,
			reactionAcceptance: data.reactionAcceptance,
		} satisfies MiNoteDraft;

		return appliedDraft;
	}
}
