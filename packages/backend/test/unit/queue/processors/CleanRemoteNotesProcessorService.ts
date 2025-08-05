/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import type {
	MiMeta,
	MiNote,
	MiUser,
	MiUserProfile,
	NotesRepository,
	NoteFavoritesRepository,
	UserNotePiningsRepository,
	UsersRepository,
	UserProfilesRepository,
} from '@/models/_.js';
import { CleanRemoteNotesProcessorService } from '@/queue/processors/CleanRemoteNotesProcessorService.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import { QueueLoggerService } from '@/queue/QueueLoggerService.js';
import { GlobalModule } from '@/GlobalModule.js';

describe('CleanRemoteNotesProcessorService', () => {
	let app: TestingModule;
	let service: CleanRemoteNotesProcessorService;
	let idService: IdService;
	let notesRepository: NotesRepository;
	let noteFavoritesRepository: NoteFavoritesRepository;
	let userNotePiningsRepository: UserNotePiningsRepository;
	let usersRepository: UsersRepository;
	let userProfilesRepository: UserProfilesRepository;
	let mockMeta: MiMeta;

	// Mock job object
	const createMockJob = () => ({
		log: jest.fn(),
		updateProgress: jest.fn(),
	});

	async function createUser(data: Partial<MiUser> = {}, profile: Partial<MiUserProfile> = {}): Promise<MiUser> {
		const id = idService.gen();
		const user = await usersRepository
			.insert({
				id: id,
				username: `user_${id}`,
				usernameLower: `user_${id}`.toLowerCase(),
				...data,
			})
			.then(x => usersRepository.findOneByOrFail(x.identifiers[0]));

		await userProfilesRepository.insert({
			userId: user.id,
			...profile,
		});

		return user;
	}

	async function createNote(data: Partial<MiNote> = {}): Promise<MiNote> {
		const id = idService.gen();
		const note = await notesRepository
			.insert({
				id: id,
				text: `note_${id}`,
				userId: data.userId || idService.gen(), // Default userId if not provided
				clippedCount: 0,
				visibility: 'public', // Required field
				localOnly: false, // Required field
				reactionAcceptance: null, // Can be null
				fileIds: [], // Required field (array)
				attachedFileTypes: [], // Required field (array)
				visibleUserIds: [], // Required field (array)
				mentions: [], // Required field (array)
				mentionedRemoteUsers: '[]', // Required field (JSON string)
				reactionAndUserPairCache: [], // Required field (array)
				emojis: [], // Required field (array)
				tags: [], // Required field (array)
				hasPoll: false, // Required field
				reactions: {}, // Required field (object)
				...data,
			})
			.then(x => notesRepository.findOneByOrFail(x.identifiers[0]));

		return note;
	}

	beforeAll(async () => {
		app = await Test
			.createTestingModule({
				imports: [
					GlobalModule,
				],
				providers: [
					CleanRemoteNotesProcessorService,
					IdService,
					{
						provide: QueueLoggerService,
						useFactory: () => ({
							logger: {
								createSubLogger: () => ({
									info: jest.fn(),
									warn: jest.fn(),
									succ: jest.fn(),
								}),
							},
						}),
					},
				],
			})
			.compile();

		service = app.get(CleanRemoteNotesProcessorService);
		idService = app.get(IdService);
		notesRepository = app.get(DI.notesRepository);
		noteFavoritesRepository = app.get(DI.noteFavoritesRepository);
		userNotePiningsRepository = app.get(DI.userNotePiningsRepository);
		usersRepository = app.get(DI.usersRepository);
		userProfilesRepository = app.get(DI.userProfilesRepository);
		mockMeta = app.get(DI.meta);

		app.enableShutdownHooks();
	});

	beforeEach(() => {
		// Reset mocks
		jest.clearAllMocks();

		// Set default meta values
		mockMeta.enableRemoteNotesCleaning = true;
		mockMeta.remoteNotesCleaningMaxProcessingDurationInMinutes = 1;
		mockMeta.remoteNotesCleaningExpiryDaysForEachNotes = 30;
	}, 60 * 1000);

	afterEach(async () => {
		// Clean up test data
		await Promise.all([
			notesRepository.createQueryBuilder().delete().execute(),
			userNotePiningsRepository.createQueryBuilder().delete().execute(),
			noteFavoritesRepository.createQueryBuilder().delete().execute(),
			userProfilesRepository.createQueryBuilder().delete().execute(),
			usersRepository.createQueryBuilder().delete().execute(),
		]);
	}, 60 * 1000);

	afterAll(async () => {
		await app.close();
	});

	describe('process', () => {
		test('should skip cleaning when enableRemoteNotesCleaning is false', async () => {
			mockMeta.enableRemoteNotesCleaning = false;
			const job = createMockJob();

			const result = await service.process(job as any);

			expect(result).toEqual({
				deletedCount: 0,
				oldest: null,
				newest: null,
				skipped: true,
			});
		});

		test('should return success result when enableRemoteNotesCleaning is true and no notes to clean', async () => {
			mockMeta.enableRemoteNotesCleaning = true;
			const job = createMockJob();
			console.log('Starting job processing...');
			const result = await service.process(job as any);

			expect(result).toEqual({
				deletedCount: 0,
				oldest: null,
				newest: null,
				skipped: false,
			});
		});
		/**
		test('should clean old remote notes correctly', async () => {
			mockMeta.enableRemoteNotesCleaning = true;
			mockMeta.remoteNotesCleaningExpiryDaysForEachNotes = 30;
			const job = createMockJob();

			// Create a remote user
			const remoteUser = await createUser({
				host: 'remote.example.com',
			});

			// Create old remote notes that should be deleted
			// Note: We need to create notes with old IDs to simulate old notes
			const oldDate = new Date();
			oldDate.setDate(oldDate.getDate() - 35); // 35 days ago
			const oldNoteId = idService.gen(oldDate.getTime());

			const oldNote = await createNote({
				id: oldNoteId,
				userId: remoteUser.id,
				userHost: 'remote.example.com',
				clippedCount: 0,
			});

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(1);
			expect(result.skipped).toBe(false);

			// Verify the note was deleted
			const deletedNote = await notesRepository.findOneBy({ id: oldNote.id });
			expect(deletedNote).toBeNull();
		});

		test('should not delete local notes', async () => {
			mockMeta.enableRemoteNotesCleaning = true;
			mockMeta.remoteNotesCleaningExpiryDaysForEachNotes = 30;
			const job = createMockJob();

			// Create a local user
			const localUser = await createUser({
				host: null, // Local user
			});

			// Create old local notes that should NOT be deleted
			const oldDate = new Date();
			oldDate.setDate(oldDate.getDate() - 35); // 35 days ago
			const oldNoteId = idService.gen(oldDate.getTime());

			const localNote = await createNote({
				id: oldNoteId,
				userId: localUser.id,
				userHost: null, // Local note
				clippedCount: 0,
			});

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(0);
			expect(result.skipped).toBe(false);

			// Verify the local note was NOT deleted
			const existingNote = await notesRepository.findOneBy({ id: localNote.id });
			expect(existingNote).not.toBeNull();
		});

		test('should not delete clipped notes', async () => {
			mockMeta.enableRemoteNotesCleaning = true;
			mockMeta.remoteNotesCleaningExpiryDaysForEachNotes = 30;
			const job = createMockJob();

			// Create a remote user
			const remoteUser = await createUser({
				host: 'remote.example.com',
			});

			// Create old remote notes that are clipped (should NOT be deleted)
			const oldDate = new Date();
			oldDate.setDate(oldDate.getDate() - 35); // 35 days ago
			const oldNoteId = idService.gen(oldDate.getTime());

			const clippedNote = await createNote({
				id: oldNoteId,
				userId: remoteUser.id,
				userHost: 'remote.example.com',
				clippedCount: 1, // Clipped
			});

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(0);
			expect(result.skipped).toBe(false);

			// Verify the clipped note was NOT deleted
			const existingNote = await notesRepository.findOneBy({ id: clippedNote.id });
			expect(existingNote).not.toBeNull();
		});

		test('should not delete favorited notes', async () => {
			mockMeta.enableRemoteNotesCleaning = true;
			mockMeta.remoteNotesCleaningExpiryDaysForEachNotes = 30;
			const job = createMockJob();

			// Create users
			const remoteUser = await createUser({
				host: 'remote.example.com',
			});
			const localUser = await createUser({
				host: null,
			});

			// Create old remote note
			const oldDate = new Date();
			oldDate.setDate(oldDate.getDate() - 35); // 35 days ago
			const oldNoteId = idService.gen(oldDate.getTime());

			const favoritedNote = await createNote({
				id: oldNoteId,
				userId: remoteUser.id,
				userHost: 'remote.example.com',
				clippedCount: 0,
			});

			// Add to favorites
			await noteFavoritesRepository.insert({
				id: idService.gen(),
				userId: localUser.id,
				noteId: favoritedNote.id,
			});

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(0);
			expect(result.skipped).toBe(false);

			// Verify the favorited note was NOT deleted
			const existingNote = await notesRepository.findOneBy({ id: favoritedNote.id });
			expect(existingNote).not.toBeNull();
		});

		test('should not delete pinned notes', async () => {
			mockMeta.enableRemoteNotesCleaning = true;
			mockMeta.remoteNotesCleaningExpiryDaysForEachNotes = 30;
			const job = createMockJob();

			// Create a remote user
			const remoteUser = await createUser({
				host: 'remote.example.com',
			});

			// Create old remote note
			const oldDate = new Date();
			oldDate.setDate(oldDate.getDate() - 35); // 35 days ago
			const oldNoteId = idService.gen(oldDate.getTime());

			const pinnedNote = await createNote({
				id: oldNoteId,
				userId: remoteUser.id,
				userHost: 'remote.example.com',
				clippedCount: 0,
			});

			// Pin the note
			await userNotePiningsRepository.insert({
				id: idService.gen(),
				userId: remoteUser.id,
				noteId: pinnedNote.id,
			});

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(0);
			expect(result.skipped).toBe(false);

			// Verify the pinned note was NOT deleted
			const existingNote = await notesRepository.findOneBy({ id: pinnedNote.id });
			expect(existingNote).not.toBeNull();
		});
		 */
	});
});
