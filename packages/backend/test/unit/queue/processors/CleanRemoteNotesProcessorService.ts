/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import ms from 'ms';
import {
	type MiNote,
	type MiUser,
	type NotesRepository,
	type NoteFavoritesRepository,
	type UserNotePiningsRepository,
	type UsersRepository,
	type UserProfilesRepository,
	MiMeta,
} from '@/models/_.js';
import { CleanRemoteNotesProcessorService } from '@/queue/processors/CleanRemoteNotesProcessorService.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import { QueueLoggerService } from '@/queue/QueueLoggerService.js';
import { GlobalModule } from '@/GlobalModule.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';

describe('CleanRemoteNotesProcessorService', () => {
	let app: TestingModule;
	let service: CleanRemoteNotesProcessorService;
	let idService: IdService;
	let notesRepository: NotesRepository;
	let noteFavoritesRepository: NoteFavoritesRepository;
	let userNotePiningsRepository: UserNotePiningsRepository;
	let usersRepository: UsersRepository;
	let userProfilesRepository: UserProfilesRepository;

	// Local user
	let alice: MiUser;
	// Remote user 1
	let bob: MiUser;
	// Remote user 2
	let carol: MiUser;

	const meta = new MiMeta();
	// Initial values for meta, can be adjusted as needed
	meta.enableRemoteNotesCleaning = true;
	meta.remoteNotesCleaningMaxProcessingDurationInMinutes = 1;
	meta.remoteNotesCleaningExpiryDaysForEachNotes = 30;

	// Mock job object
	const createMockJob = () => ({
		log: jest.fn(),
		updateProgress: jest.fn(),
	});

	async function createUser(data: Partial<MiUser> = {}) {
		const id = idService.gen();
		const un = data.username || secureRndstr(16);
		const user = await usersRepository
			.insert({
				id,
				username: un,
				usernameLower: un.toLowerCase(),
				...data,
			})
			.then(x => usersRepository.findOneByOrFail(x.identifiers[0]));

		await userProfilesRepository.save({
			userId: id,
		});

		return user;
	}

	async function createNote(data: Partial<MiNote>, user: MiUser, time?: number): Promise<MiNote> {
		const id = idService.gen(time);
		const note = await notesRepository
			.insert({
				id: id,
				text: `note_${id}`,
				userId: user.id,
				userHost: user.host,
				visibility: 'public',
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
			.overrideProvider(DI.meta).useFactory({ factory: () => meta })
			.compile();

		service = app.get(CleanRemoteNotesProcessorService);
		idService = app.get(IdService);
		notesRepository = app.get(DI.notesRepository);
		noteFavoritesRepository = app.get(DI.noteFavoritesRepository);
		userNotePiningsRepository = app.get(DI.userNotePiningsRepository);
		usersRepository = app.get(DI.usersRepository);
		userProfilesRepository = app.get(DI.userProfilesRepository);

		alice = await createUser({ username: 'alice', host: null });
		bob = await createUser({ username: 'bob', host: 'remote1.example.com' });
		carol = await createUser({ username: 'carol', host: 'remote2.example.com' });

		app.enableShutdownHooks();
	});

	beforeEach(() => {
		// Reset mocks
		jest.clearAllMocks();

		// Set default meta values
		meta.enableRemoteNotesCleaning = true;
		meta.remoteNotesCleaningMaxProcessingDurationInMinutes = 1;
		meta.remoteNotesCleaningExpiryDaysForEachNotes = 30;
	}, 60 * 1000);

	afterEach(async () => {
		// Clean up test data
		await Promise.all([
			notesRepository.createQueryBuilder().delete().execute(),
			userNotePiningsRepository.createQueryBuilder().delete().execute(),
			noteFavoritesRepository.createQueryBuilder().delete().execute(),
		]);
	}, 60 * 1000);

	afterAll(async () => {
		await app.close();
	});

	describe('basic', () => {
		test('should skip cleaning when enableRemoteNotesCleaning is false', async () => {
			meta.enableRemoteNotesCleaning = false;
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
			const job = createMockJob();

			await createNote({}, alice);
			const result = await service.process(job as any);

			expect(result).toEqual({
				deletedCount: 0,
				oldest: null,
				newest: null,
				skipped: false,
			});
		});

		test('should clean remote notes and return stats', async () => {
			// Remote notes
			const remoteNotes = await Promise.all([
				createNote({}, bob),
				createNote({}, carol),
				createNote({}, bob, Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000),
				createNote({}, carol, Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 2000), // Note older than expiry
			]);

			// Local notes
			const localNotes = await Promise.all([
				createNote({}, alice),
				createNote({}, alice, Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000),
			]);

			const job = createMockJob();

			const result = await service.process(job as any);

			expect(result).toEqual({
				deletedCount: 2,
				oldest: expect.any(Number),
				newest: expect.any(Number),
				skipped: false,
			});

			// Check side-by-side from all notes
			const remainingNotes = await notesRepository.find();
			expect(remainingNotes.length).toBe(4);
			expect(remainingNotes.some(n => n.id === remoteNotes[0].id)).toBe(true);
			expect(remainingNotes.some(n => n.id === remoteNotes[1].id)).toBe(true);
			expect(remainingNotes.some(n => n.id === remoteNotes[2].id)).toBe(false);
			expect(remainingNotes.some(n => n.id === remoteNotes[3].id)).toBe(false);
			expect(remainingNotes.some(n => n.id === localNotes[0].id)).toBe(true);
			expect(remainingNotes.some(n => n.id === localNotes[1].id)).toBe(true);
		});
	});

	describe('advanced', () => {
		// お気に入り
		test('should not delete notes that are favorited by any user', async () => {
			const job = createMockJob();

			// Create old remote note that should be deleted
			const oldRemoteNote = await createNote({}, bob, Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000);
			
			// Favorite the note
			await noteFavoritesRepository.save({
				id: idService.gen(),
				userId: alice.id,
				noteId: oldRemoteNote.id,
			});

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(0);
			expect(result.skipped).toBe(false);

			// Verify the favorited note was NOT deleted
			const remainingNote = await notesRepository.findOneBy({ id: oldRemoteNote.id });
			expect(remainingNote).not.toBeNull();
		});

		// ピン留め
		test('should not delete notes that are pinned by the user', async () => {
			const job = createMockJob();

			// Create old remote note that should be deleted
			const oldRemoteNote = await createNote({}, bob, Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000);
			
			// Pin the note by the user who created it
			await userNotePiningsRepository.save({
				id: idService.gen(),
				userId: bob.id, // Same user as the note creator
				noteId: oldRemoteNote.id,
			});

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(0);
			expect(result.skipped).toBe(false);

			// Verify the pinned note was NOT deleted
			const remainingNote = await notesRepository.findOneBy({ id: oldRemoteNote.id });
			expect(remainingNote).not.toBeNull();
		});

		// クリップ
		test('should not delete notes with clippedCount > 0', async () => {
			const job = createMockJob();

			// Create old remote note that is clipped
			const clippedNote = await createNote({
				clippedCount: 1, // Clipped
			}, bob, Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000);

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(0);
			expect(result.skipped).toBe(false);

			// Verify the clipped note was NOT deleted
			const remainingNote = await notesRepository.findOneBy({ id: clippedNote.id });
			expect(remainingNote).not.toBeNull();
		});

		// reply, renoteが含まれている時の挙動
		test('should handle reply/renote relationships correctly', async () => {
			const job = createMockJob();

			// Create old remote notes with reply/renote relationships
			const originalNote = await createNote({}, bob, Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000);
			const replyNote = await createNote({
				replyId: originalNote.id,
			}, carol, Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 2000);
			const renoteNote = await createNote({
				renoteId: originalNote.id,
			}, bob, Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 3000);

			const result = await service.process(job as any);

			// Should delete all three notes as they are all old and remote
			expect(result.deletedCount).toBe(3);
			expect(result.skipped).toBe(false);

			// Verify all notes were deleted
			const remainingNotes = await notesRepository.find();
			expect(remainingNotes.some(n => n.id === originalNote.id)).toBe(false);
			expect(remainingNotes.some(n => n.id === replyNote.id)).toBe(false);
			expect(remainingNotes.some(n => n.id === renoteNote.id)).toBe(false);
		});

		// 古いリモートノートに新しいリプライがある時、どちらも削除されない
		test('should not delete both old remote note with new reply', async () => {
			const job = createMockJob();

			// Create old remote note that should be deleted
			const oldNote = await createNote({}, bob, Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000);

			// Create a reply note that is newer than the expiry period
			const recentReplyNote = await createNote({
				replyId: oldNote.id,
			}, carol, Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) + 1000);

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(0); // Only the old note should be deleted
			expect(result.skipped).toBe(false);
			// Verify only the old note was deleted
			const remainingNotes = await notesRepository.find();
			expect(remainingNotes.some(n => n.id === oldNote.id)).toBe(true);
			expect(remainingNotes.some(n => n.id === recentReplyNote.id)).toBe(true); // Recent reply note should remain
		});

		test('should handle mixed scenarios with multiple conditions', async () => {
			const job = createMockJob();

			// Create various types of notes
			const oldTime = Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000;

			// Should be deleted: old remote note with no special conditions
			const deletableNote = await createNote({}, bob, oldTime);

			// Should NOT be deleted: old remote note but favorited
			const favoritedNote = await createNote({}, carol, oldTime);
			await noteFavoritesRepository.save({
				id: idService.gen(),
				userId: alice.id,
				noteId: favoritedNote.id,
			});

			// Should NOT be deleted: old remote note but pinned
			const pinnedNote = await createNote({}, bob, oldTime);
			await userNotePiningsRepository.save({
				id: idService.gen(),
				userId: bob.id,
				noteId: pinnedNote.id,
			});

			// Should NOT be deleted: old remote note but clipped
			const clippedNote = await createNote({
				clippedCount: 2,
			}, carol, oldTime);

			// Should NOT be deleted: old local note
			const localNote = await createNote({}, alice, oldTime);

			// Should NOT be deleted: new remote note
			const newRemoteNote = await createNote({}, bob);

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(1); // Only deletableNote should be deleted
			expect(result.skipped).toBe(false);

			// Verify correct notes remain
			const remainingNotes = await notesRepository.find();
			expect(remainingNotes.length).toBe(5);
			expect(remainingNotes.some(n => n.id === deletableNote.id)).toBe(false); // Deleted
			expect(remainingNotes.some(n => n.id === favoritedNote.id)).toBe(true); // Kept
			expect(remainingNotes.some(n => n.id === pinnedNote.id)).toBe(true); // Kept
			expect(remainingNotes.some(n => n.id === clippedNote.id)).toBe(true); // Kept
			expect(remainingNotes.some(n => n.id === localNote.id)).toBe(true); // Kept
			expect(remainingNotes.some(n => n.id === newRemoteNote.id)).toBe(true); // Kept
		});

		// 大量のノート
		test('should handle large number of notes correctly', async () => {
			const AMOUNT = 130;
			const job = createMockJob();

			const oldTime = Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000;
			const noteIds = [];
			for (let i = 0; i < AMOUNT; i++) {
				const note = await createNote({}, bob, oldTime - i);
				noteIds.push(note.id);
			}

			const result = await service.process(job as any);

			// Should delete all notes, but may require multiple batches
			expect(result.deletedCount).toBe(AMOUNT);
			expect(result.skipped).toBe(false);

			// Verify all notes were deleted
			const remainingNotes = await notesRepository.find();
			expect(remainingNotes.length).toBe(0);
		});

		// 大量のノート + リプライ or リノート
		test('should handle large number of notes with replies correctly', async () => {
			const AMOUNT = 130;
			const job = createMockJob();

			const oldTime = Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000;
			const noteIds = [];
			for (let i = 0; i < AMOUNT; i++) {
				const note = await createNote({}, bob, oldTime - i - AMOUNT);
				noteIds.push(note.id);
				if (i % 2 === 0) {
					// Create a reply for every second note
					await createNote({ replyId: note.id }, carol, oldTime - i);
				} else {
					// Create a renote for every second note
					await createNote({ renoteId: note.id }, bob, oldTime - i);
				}
			}

			const result = await service.process(job as any);
			// Should delete all notes, but may require multiple batches
			expect(result.deletedCount).toBe(AMOUNT * 2);
			expect(result.skipped).toBe(false);
		});

		// 大量の古いノート + 新しいリプライ or リノート
		test('should handle large number of old notes with new replies correctly', async () => {
			const AMOUNT = 130;
			const job = createMockJob();

			const oldTime = Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000;
			const newTime = Date.now();
			const noteIds = [];
			for (let i = 0; i < AMOUNT; i++) {
				const note = await createNote({}, bob, oldTime - i);
				noteIds.push(note.id);
				if (i % 2 === 0) {
					// Create a reply for every second note
					await createNote({ replyId: note.id }, carol, newTime + i);
				} else {
					// Create a renote for every second note
					await createNote({ renoteId: note.id }, bob, newTime + i);
				}
			}
			const result = await service.process(job as any);
			// Should delete all old notes, but keep the new replies/renotes
			expect(result.deletedCount).toBe(0);
			expect(result.skipped).toBe(false);
		});

		test('should update cursor correctly during batch processing', async () => {
			const job = createMockJob();

			// Create notes with specific timing to test cursor behavior
			const baseTime = Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 10000;
			
			const note1 = await createNote({}, bob, baseTime);
			const note2 = await createNote({}, carol, baseTime - 1000);
			const note3 = await createNote({}, bob, baseTime - 2000);

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(3);
			expect(result.newest).toBe(idService.parse(note1.id).date.getTime());
			expect(result.oldest).toBe(idService.parse(note3.id).date.getTime());
			expect(result.skipped).toBe(false);
		});
	});
});
