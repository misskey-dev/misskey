/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, jest, expect, beforeAll, beforeEach, afterEach, afterAll, test } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { randomString } from '../utils.js';
import { NoteMutingService } from '@/core/note/NoteMutingService.js';
import {
	MiNoteMuting,
	MiNote,
	MiUser,
	NoteMutingsRepository,
	NotesRepository,
	UsersRepository,
} from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { GlobalModule } from '@/GlobalModule.js';
import { CoreModule } from '@/core/CoreModule.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { QueryService } from '@/core/QueryService.js';

process.env.NODE_ENV = 'test';

describe('NoteMutingService', () => {
	let app: TestingModule;
	let service: NoteMutingService;

	// --------------------------------------------------------------------------------------

	let notesRepository: NotesRepository;
	let noteMutingsRepository: NoteMutingsRepository;
	let usersRepository: UsersRepository;
	let idService: IdService;
	let globalEventService: GlobalEventService;
	let queryService: QueryService;

	// --------------------------------------------------------------------------------------

	// Helper function to create a user
	async function createUser(data: Partial<MiUser> = {}): Promise<MiUser> {
		const user = {
			id: idService.gen(),
			username: randomString(),
			usernameLower: randomString().toLowerCase(),
			host: null,
			...data,
		};

		return await usersRepository.insert(user)
			.then(x => usersRepository.findOneByOrFail(x.identifiers[0]));
	}

	// Helper function to create a note
	async function createNote(data: Partial<MiNote> = {}): Promise<MiNote> {
		return await notesRepository.insert({
			id: idService.gen(),
			userId: data.userId ?? (await createUser()).id,
			text: randomString(),
			visibility: 'public',
			...data,
		})
			.then(x => notesRepository.findOneByOrFail(x.identifiers[0]));
	}

	// Helper function to create a note muting
	async function createNoteMuting(data: Partial<MiNoteMuting> = {}): Promise<MiNoteMuting> {
		const id = idService.gen();
		const noteMuting = {
			id,
			userId: data.userId || (await createUser()).id,
			noteId: data.noteId || (await createNote()).id,
			expiresAt: null,
			...data,
		};

		return await noteMutingsRepository.insert(noteMuting)
			.then(x => noteMutingsRepository.findOneByOrFail(x.identifiers[0]));
	}

	// --------------------------------------------------------------------------------------

	beforeAll(async () => {
		app = await Test
			.createTestingModule({
				imports: [
					GlobalModule,
					CoreModule,
				],
			})
			.compile();

		service = app.get(NoteMutingService);
		idService = app.get(IdService);
		queryService = app.get(QueryService);
		globalEventService = app.get(GlobalEventService);
		notesRepository = app.get(DI.notesRepository);
		noteMutingsRepository = app.get(DI.noteMutingsRepository);
		usersRepository = app.get(DI.usersRepository);

		app.enableShutdownHooks();
	});

	beforeEach(async () => {
		// Clean database before each test
		await noteMutingsRepository.delete({});
		await notesRepository.delete({});
		await usersRepository.delete({});
	});

	afterEach(async () => {
		// Clean database after each test
		await noteMutingsRepository.delete({});
		await notesRepository.delete({});
		await usersRepository.delete({});
	});

	afterAll(async () => {
		await app.close();
	});

	// --------------------------------------------------------------------------------------

	describe('create', () => {
		test('should create a note muting', async () => {
			// Create a user and a note
			const user = await createUser();
			const note = await createNote();

			// Create a note muting
			await service.create({
				userId: user.id,
				noteId: note.id,
				expiresAt: null,
			});

			// Verify the note muting was created
			const noteMuting = await noteMutingsRepository.findOneBy({
				userId: user.id,
				noteId: note.id,
			});

			expect(noteMuting).not.toBeNull();
			expect(noteMuting?.userId).toBe(user.id);
			expect(noteMuting?.noteId).toBe(note.id);
		});

		test('should throw NoSuchNoteError if note does not exist', async () => {
			// Create a user
			const user = await createUser();
			const nonexistentNoteId = idService.gen();

			// Attempt to create a note muting with a non-existent note
			await expect(service.create({
				userId: user.id,
				noteId: nonexistentNoteId,
				expiresAt: null,
			})).rejects.toThrow(NoteMutingService.NoSuchNoteError);

			// Verify no note muting was created
			const noteMuting = await noteMutingsRepository.findOneBy({
				userId: user.id,
				noteId: nonexistentNoteId,
			});

			expect(noteMuting).toBeNull();
		});
	});

	describe('delete', () => {
		test('should delete a note muting', async () => {
			// Create a user, note, and note muting
			const user = await createUser();
			const note = await createNote();
			const noteMuting = await createNoteMuting({
				userId: user.id,
				noteId: note.id,
			});

			// Verify the note muting exists
			const beforeDelete = await noteMutingsRepository.findOneBy({
				userId: user.id,
				noteId: note.id,
			});
			expect(beforeDelete).not.toBeNull();

			// Delete the note muting
			await service.delete(user.id, note.id);

			// Verify the note muting was deleted
			const afterDelete = await noteMutingsRepository.findOneBy({
				userId: user.id,
				noteId: note.id,
			});
			expect(afterDelete).toBeNull();
		});

		test('should throw NotMutedError if muting does not exist', async () => {
			// Create a user and note
			const user = await createUser();
			const note = await createNote();

			// Attempt to delete a non-existent note muting
			await expect(service.delete(user.id, note.id)).rejects.toThrow(NoteMutingService.NotMutedError);
		});
	});

	describe('isMuting', () => {
		test('should return true if user is muting the note', async () => {
			// Create a user, note, and note muting
			const user = await createUser();
			const note = await createNote();
			await createNoteMuting({
				userId: user.id,
				noteId: note.id,
			});

			// Check if the user is muting the note
			const result = await service.isMuting(user.id, note.id);

			expect(result).toBe(true);
		});

		test('should return false if user is not muting the note', async () => {
			// Create a user and note, but no muting
			const user = await createUser();
			const note = await createNote();

			// Check if the user is muting the note
			const result = await service.isMuting(user.id, note.id);

			expect(result).toBe(false);
		});
	});

	describe('getMutingNoteIdsSet', () => {
		test('should return a set of muted note IDs', async () => {
			// Create a user and multiple notes
			const user = await createUser();
			const note1 = await createNote();
			const note2 = await createNote();
			const note3 = await createNote();

			// Create note mutings for two of the notes
			await createNoteMuting({
				userId: user.id,
				noteId: note1.id,
			});
			await createNoteMuting({
				userId: user.id,
				noteId: note2.id,
			});

			// Get the set of muted note IDs
			const result = await service.getMutingNoteIdsSet(user.id);

			// Verify the result is a Set containing the muted note IDs
			expect(result).toBeInstanceOf(Set);
			expect(result.has(note1.id)).toBe(true);
			expect(result.has(note2.id)).toBe(true);
			expect(result.has(note3.id)).toBe(false);
		});
	});

	describe('listByUserId', () => {
		test('should return a list of note mutings for a user', async () => {
			// Create a user and multiple notes
			const user = await createUser();
			const note1 = await createNote();
			const note2 = await createNote();

			// Create note mutings
			const muting1 = await createNoteMuting({
				userId: user.id,
				noteId: note1.id,
			});
			const muting2 = await createNoteMuting({
				userId: user.id,
				noteId: note2.id,
			});

			// Get the list of note mutings
			const result = await service.listByUserId({ userId: user.id });

			// Verify the result contains the expected mutings
			expect(result).toHaveLength(2);
			expect(result.map(m => m.id).sort()).toEqual([muting1.id, muting2.id].sort());
			expect(result.map(m => m.noteId).sort()).toEqual([note1.id, note2.id].sort());
		});
	});

	describe('cleanupExpiredMutes', () => {
		test('should delete expired mutes', async () => {
			// Create users and notes
			const user1 = await createUser();
			const user2 = await createUser();
			const note1 = await createNote();
			const note2 = await createNote();
			const note3 = await createNote();

			// Set the expiration date to 1 hour ago
			const expiredDate = new Date();
			expiredDate.setHours(expiredDate.getHours() - 1);

			// Set the expiration date to 1 hour in the future
			const futureDate = new Date();
			futureDate.setHours(futureDate.getHours() + 1);

			// Create expired note mutings
			const expiredMuting1 = await createNoteMuting({
				userId: user1.id,
				noteId: note1.id,
				expiresAt: expiredDate,
			});

			const expiredMuting2 = await createNoteMuting({
				userId: user1.id,
				noteId: note2.id,
				expiresAt: expiredDate,
			});

			const expiredMuting3 = await createNoteMuting({
				userId: user2.id,
				noteId: note3.id,
				expiresAt: expiredDate,
			});

			// Create non-expired note muting
			const activeMuting = await createNoteMuting({
				userId: user2.id,
				noteId: note1.id,
				expiresAt: futureDate,
			});

			// Create permanent note muting (no expiration)
			const permanentMuting = await createNoteMuting({
				userId: user2.id,
				noteId: note2.id,
				expiresAt: null,
			});

			// Verify all mutings exist before cleanup
			expect(await noteMutingsRepository.findOneBy({ id: expiredMuting1.id })).not.toBeNull();
			expect(await noteMutingsRepository.findOneBy({ id: expiredMuting2.id })).not.toBeNull();
			expect(await noteMutingsRepository.findOneBy({ id: expiredMuting3.id })).not.toBeNull();
			expect(await noteMutingsRepository.findOneBy({ id: activeMuting.id })).not.toBeNull();
			expect(await noteMutingsRepository.findOneBy({ id: permanentMuting.id })).not.toBeNull();

			// Run cleanup
			await service.cleanupExpiredMutes();

			// Verify expired mutings are deleted and others remain
			expect(await noteMutingsRepository.findOneBy({ id: expiredMuting1.id })).toBeNull();
			expect(await noteMutingsRepository.findOneBy({ id: expiredMuting2.id })).toBeNull();
			expect(await noteMutingsRepository.findOneBy({ id: expiredMuting3.id })).toBeNull();
			expect(await noteMutingsRepository.findOneBy({ id: activeMuting.id })).not.toBeNull();
			expect(await noteMutingsRepository.findOneBy({ id: permanentMuting.id })).not.toBeNull();

			// Verify cache is updated by checking isMuting
			expect(await service.isMuting(user1.id, note1.id)).toBe(false);
			expect(await service.isMuting(user1.id, note2.id)).toBe(false);
			expect(await service.isMuting(user2.id, note3.id)).toBe(false);
			expect(await service.isMuting(user2.id, note1.id)).toBe(true);
			expect(await service.isMuting(user2.id, note2.id)).toBe(true);
		});
	});
});
