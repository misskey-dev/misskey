/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { DeletedNotesRepository, NotesRepository, UsersRepository } from '@/models/_.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import type { MiLocalUser, MiRemoteUser, MiUser } from '@/models/User.js';
import type { MiNote } from '@/models/Note.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class GetterService {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.deletedNotesRepository)
		private deletedNotesRepository: DeletedNotesRepository,

		private userEntityService: UserEntityService,
	) {
	}

	/**
	 * Get note for API processing
	 */
	@bindThis
	public async getNote(noteId: MiNote['id']) {
		const note = await this.notesRepository.findOneBy({ id: noteId });

		if (note == null) {
			throw new IdentifiableError('9725d0ce-ba28-4dde-95a7-2cbb2c15de24', 'No such note.');
		}

		return note;
	}

	@bindThis
	public async getDeletedNote(noteId: MiNote['id']) {
		const note = await this.deletedNotesRepository.findOneBy({ id: noteId });

		if (note == null) {
			throw new IdentifiableError('f2d7e5b8-9d79-4996-b996-89b538a1b71f', 'No such deleted note.');
		}

		return note;
	}

	@bindThis
	public async getNoteWithRelations(noteId: MiNote['id']) {
		const note = await this.notesRepository.findOne({ where: { id: noteId }, relations: ['user', 'reply', 'renote', 'reply.user', 'renote.user'] });

		if (note == null) {
			throw new IdentifiableError('9725d0ce-ba28-4dde-95a7-2cbb2c15de24', 'No such note.');
		}

		return note;
	}

	@bindThis
	public async getDeletedNoteWithRelations(noteId: MiNote['id']) {
		const note = await this.deletedNotesRepository.findOne({ where: { id: noteId }, relations: ['user', 'reply', 'renote', 'reply.user', 'renote.user'] });

		if (note == null) {
			throw new IdentifiableError('f2d7e5b8-9d79-4996-b996-89b538a1b71f', 'No such deleted note.');
		}

		return note;
	}

	/**
	 * Get user for API processing
	 */
	@bindThis
	public async getUser(userId: MiUser['id']) {
		const user = await this.usersRepository.findOneBy({ id: userId });

		if (user == null) {
			throw new IdentifiableError('15348ddd-432d-49c2-8a5a-8069753becff', 'No such user.');
		}

		return user as MiLocalUser | MiRemoteUser;
	}

	/**
	 * Get remote user for API processing
	 */
	@bindThis
	public async getRemoteUser(userId: MiUser['id']) {
		const user = await this.getUser(userId);

		if (!this.userEntityService.isRemoteUser(user)) {
			throw new Error('user is not a remote user');
		}

		return user;
	}

	/**
	 * Get local user for API processing
	 */
	@bindThis
	public async getLocalUser(userId: MiUser['id']) {
		const user = await this.getUser(userId);

		if (!this.userEntityService.isLocalUser(user)) {
			throw new Error('user is not a local user');
		}

		return user;
	}
}

