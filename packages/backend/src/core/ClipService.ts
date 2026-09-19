/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { ClipsRepository, MiNote, MiClip, ClipNotesRepository, NotesRepository } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { isDuplicateKeyValueError } from '@/misc/is-duplicate-key-value-error.js';
import { RoleService } from '@/core/RoleService.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import type { MiLocalUser } from '@/models/User.js';

@Injectable()
export class ClipService {
	public static NoSuchNoteError = class extends Error {};
	public static NoSuchClipError = class extends Error {};
	public static AlreadyAddedError = class extends Error {};
	public static TooManyClipNotesError = class extends Error {};
	public static TooManyClipsError = class extends Error {};

	// クリップに同名多数のユーザーがカラム等で購読している場合、更新の度に全員へreload指示が飛びリクエストがスパイクしうるため、
	// 短時間の連続更新はまとめて1回(先頭 + 最終更新からの静穏化後の末尾)だけ配信する
	private static readonly UPDATED_THROTTLE_MS = 3000;
	private readonly pendingUpdated = new Map<MiClip['id'], { timer: NodeJS.Timeout; trailing: boolean }>();

	constructor(
		@Inject(DI.clipsRepository)
		private clipsRepository: ClipsRepository,

		@Inject(DI.clipNotesRepository)
		private clipNotesRepository: ClipNotesRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private roleService: RoleService,
		private idService: IdService,
		private globalEventService: GlobalEventService,
	) {
	}

	@bindThis
	private publishUpdated(clipId: MiClip['id']): void {
		const pending = this.pendingUpdated.get(clipId);
		if (pending == null) {
			// バースト先頭は即時配信し、静穏化ウィンドウを開始する
			this.globalEventService.publishClipStream(clipId, 'updated');
			this.pendingUpdated.set(clipId, {
				trailing: false,
				timer: setTimeout(() => this.flushUpdated(clipId), ClipService.UPDATED_THROTTLE_MS),
			});
		} else {
			// ウィンドウ内の追加更新は末尾でまとめて1回だけ配信する
			pending.trailing = true;
			clearTimeout(pending.timer);
			pending.timer = setTimeout(() => this.flushUpdated(clipId), ClipService.UPDATED_THROTTLE_MS);
		}
	}

	@bindThis
	private flushUpdated(clipId: MiClip['id']): void {
		const pending = this.pendingUpdated.get(clipId);
		this.pendingUpdated.delete(clipId);
		if (pending?.trailing) {
			this.globalEventService.publishClipStream(clipId, 'updated');
		}
	}

	@bindThis
	public async create(me: MiLocalUser, name: string, isPublic: boolean, description: string | null): Promise<MiClip> {
		const currentCount = await this.clipsRepository.countBy({
			userId: me.id,
		});
		if (currentCount >= (await this.roleService.getUserPolicies(me.id)).clipLimit) {
			throw new ClipService.TooManyClipsError();
		}

		const clip = await this.clipsRepository.insertOne({
			id: this.idService.gen(),
			userId: me.id,
			name: name,
			isPublic: isPublic,
			description: description,
		});

		return clip;
	}

	@bindThis
	public async update(me: MiLocalUser, clipId: MiClip['id'], name: string | undefined, isPublic: boolean | undefined, description: string | null | undefined): Promise<void> {
		const clip = await this.clipsRepository.findOneBy({
			id: clipId,
			userId: me.id,
		});

		if (clip == null) {
			throw new ClipService.NoSuchClipError();
		}

		await this.clipsRepository.update(clip.id, {
			name: name,
			description: description,
			isPublic: isPublic,
		});

		this.publishUpdated(clip.id);
	}

	@bindThis
	public async delete(me: MiLocalUser, clipId: MiClip['id']): Promise<void> {
		const clip = await this.clipsRepository.findOneBy({
			id: clipId,
			userId: me.id,
		});

		if (clip == null) {
			throw new ClipService.NoSuchClipError();
		}

		const pending = this.pendingUpdated.get(clip.id);
		if (pending != null) {
			clearTimeout(pending.timer);
			this.pendingUpdated.delete(clip.id);
		}
		this.globalEventService.publishClipStream(clip.id, 'deleted');

		await this.clipsRepository.delete(clip.id);
	}

	@bindThis
	public async addNote(me: MiLocalUser, clipId: MiClip['id'], noteId: MiNote['id']): Promise<void> {
		const clip = await this.clipsRepository.findOneBy({
			id: clipId,
			userId: me.id,
		});

		if (clip == null) {
			throw new ClipService.NoSuchClipError();
		}

		const currentCount = await this.clipNotesRepository.countBy({
			clipId: clip.id,
		});
		if (currentCount >= (await this.roleService.getUserPolicies(me.id)).noteEachClipsLimit) {
			throw new ClipService.TooManyClipNotesError();
		}

		try {
			await this.clipNotesRepository.insert({
				id: this.idService.gen(),
				noteId: noteId,
				clipId: clip.id,
			});
		} catch (e: unknown) {
			if (e instanceof QueryFailedError) {
				if (isDuplicateKeyValueError(e)) {
					throw new ClipService.AlreadyAddedError();
				} else if (e.driverError.detail.includes('is not present in table "note".')) {
					throw new ClipService.NoSuchNoteError();
				}
			}

			throw e;
		}

		this.clipsRepository.update(clip.id, {
			lastClippedAt: new Date(),
		});

		this.notesRepository.increment({ id: noteId }, 'clippedCount', 1);

		this.publishUpdated(clip.id);
	}

	@bindThis
	public async removeNote(me: MiLocalUser, clipId: MiClip['id'], noteId: MiNote['id']): Promise<void> {
		const clip = await this.clipsRepository.findOneBy({
			id: clipId,
			userId: me.id,
		});

		if (clip == null) {
			throw new ClipService.NoSuchClipError();
		}

		const note = await this.notesRepository.findOneBy({ id: noteId });

		if (note == null) {
			throw new ClipService.NoSuchNoteError();
		}

		await this.clipNotesRepository.delete({
			noteId: noteId,
			clipId: clip.id,
		});

		this.notesRepository.decrement({ id: noteId }, 'clippedCount', 1);

		this.publishUpdated(clip.id);
	}
}
