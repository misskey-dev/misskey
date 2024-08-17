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
import type { MiLocalUser } from '@/models/User.js';

@Injectable()
export class ClipService {
	public static NoSuchNoteError = class extends Error {};
	public static NoSuchClipError = class extends Error {};
	public static AlreadyAddedError = class extends Error {};
	public static TooManyClipNotesError = class extends Error {};
	public static TooManyClipsError = class extends Error {};
	public static ClipLimitExceededError = class extends Error {};
	public static ClipNotesLimitExceededError = class extends Error {};

	constructor(
		@Inject(DI.clipsRepository)
		private clipsRepository: ClipsRepository,

		@Inject(DI.clipNotesRepository)
		private clipNotesRepository: ClipNotesRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private roleService: RoleService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async create(me: MiLocalUser, name: string, isPublic: boolean, description: string | null): Promise<MiClip> {
		const policies = await this.roleService.getUserPolicies(me.id);

		const currentCount = await this.clipsRepository.countBy({
			userId: me.id,
		});
		if (currentCount >= policies.clipLimit) {
			throw new ClipService.TooManyClipsError();
		}

		const currentNoteCounts = await this.clipNotesRepository
			.createQueryBuilder('cn')
			.select('COUNT(*)')
			.innerJoin('cn.clip', 'c')
			.where('c.userId = :userId', { userId: me.id })
			.groupBy('cn.clipId')
			.getRawMany<{ count: number }>();
		if (currentNoteCounts.some((x) => x.count > policies.noteEachClipsLimit)) {
			throw new ClipService.ClipNotesLimitExceededError();
		}

		const clip = await this.clipsRepository.insert({
			id: this.idService.gen(),
			userId: me.id,
			name: name,
			isPublic: isPublic,
			description: description,
		}).then(x => this.clipsRepository.findOneByOrFail(x.identifiers[0]));

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

		const policies = await this.roleService.getUserPolicies(me.id);

		const currentCount = await this.clipsRepository.countBy({
			userId: me.id,
		});
		if (currentCount > policies.clipLimit) {
			throw new ClipService.ClipLimitExceededError();
		}

		const currentNoteCounts = await this.clipNotesRepository
			.createQueryBuilder('cn')
			.select('COUNT(*)')
			.innerJoin('cn.clip', 'c')
			.where('c.userId = :userId', { userId: me.id })
			.groupBy('cn.clipId')
			.getRawMany<{ count: number }>();
		if (currentNoteCounts.some((x) => x.count > policies.noteEachClipsLimit)) {
			throw new ClipService.ClipNotesLimitExceededError();
		}

		await this.clipsRepository.update(clip.id, {
			name: name,
			description: description,
			isPublic: isPublic,
		});
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

		if (await this.clipNotesRepository.existsBy({ clipId, noteId })) {
			throw new ClipService.AlreadyAddedError();
		}

		const policies = await this.roleService.getUserPolicies(me.id);

		const currentClipCount = await this.clipsRepository.countBy({
			userId: me.id,
		});
		if (currentClipCount > policies.clipLimit) {
			throw new ClipService.ClipLimitExceededError();
		}

		const currentNoteCount = await this.clipNotesRepository.countBy({
			clipId: clip.id,
		});
		if (currentNoteCount >= policies.noteEachClipsLimit) {
			throw new ClipService.TooManyClipNotesError();
		}

		const currentNoteCounts = await this.clipNotesRepository
			.createQueryBuilder('cn')
			.select('COUNT(*)')
			.innerJoin('cn.clip', 'c')
			.where('c.userId = :userId', { userId: me.id })
			.groupBy('cn.clipId')
			.getRawMany<{ count: number }>();
		if (currentNoteCounts.some((x) => x.count > policies.noteEachClipsLimit)) {
			throw new ClipService.ClipNotesLimitExceededError();
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
	}
}
