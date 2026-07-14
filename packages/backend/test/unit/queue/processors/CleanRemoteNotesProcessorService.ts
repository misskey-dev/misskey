/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import ms from 'ms';
import {
	type MiNote,
	type MiUser,
	type NotesRepository,
	type NoteFavoritesRepository,
	type NoteReactionsRepository,
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
	let noteReactionsRepository: NoteReactionsRepository;
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

	// Mock job object
	const createMockJob = () => ({
		log: vi.fn(),
		updateProgress: vi.fn(),
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
									info: vi.fn(),
									warn: vi.fn(),
									succ: vi.fn(),
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
		noteReactionsRepository = app.get(DI.noteReactionsRepository);
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
		vi.clearAllMocks();

		// Set default meta values
		meta.enableRemoteNotesCleaning = true;
		meta.remoteNotesCleaningMaxProcessingDurationInMinutes = 0.3;
		meta.remoteNotesCleaningExpiryDaysForEachNotes = 30;
	}, 60 * 1000);

	afterEach(async () => {
		// Clean up test data
		await Promise.all([
			notesRepository.createQueryBuilder().delete().execute(),
			userNotePiningsRepository.createQueryBuilder().delete().execute(),
			noteFavoritesRepository.createQueryBuilder().delete().execute(),
			noteReactionsRepository.createQueryBuilder().delete().execute(),
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
				transientErrors: 0,
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
				transientErrors: 0,
			});
		}, 3000);

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

			// remoteNotes[2] is newer of the two deleted (older-than-expiry by 1000ms),
			// remoteNotes[3] is older of the two deleted (older-than-expiry by 2000ms)
			expect(result).toEqual({
				deletedCount: 2,
				oldest: idService.parse(remoteNotes[3].id).date.getTime(),
				newest: idService.parse(remoteNotes[2].id).date.getTime(),
				skipped: false,
				transientErrors: 0,
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
		test('should not delete note that is favorited by any user', async () => {
			const job = createMockJob();

			// Create old remote note that should be deleted
			const olderRemoteNote = await createNote({}, bob, Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000);

			// Favorite the note
			await noteFavoritesRepository.save({
				id: idService.gen(),
				userId: alice.id,
				noteId: olderRemoteNote.id,
			});

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(0);
			expect(result.skipped).toBe(false);

			const remainingNote = await notesRepository.findOneBy({ id: olderRemoteNote.id });
			expect(remainingNote).not.toBeNull();
		});

		// ピン留め
		test('should not delete note that is pinned by the user', async () => {
			const job = createMockJob();

			// Create old remote note that should be deleted
			const olderRemoteNote = await createNote({}, bob, Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000);

			// Pin the note by the user who created it
			await userNotePiningsRepository.save({
				id: idService.gen(),
				userId: bob.id, // Same user as the note creator
				noteId: olderRemoteNote.id,
			});

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(0);
			expect(result.skipped).toBe(false);

			const remainingNote = await notesRepository.findOneBy({ id: olderRemoteNote.id });
			expect(remainingNote).not.toBeNull();
		});

		// クリップ
		test('should not delete note that is clipped', async () => {
			const job = createMockJob();

			// Create old remote note that is clipped
			const clippedNote = await createNote({
				clippedCount: 1, // Clipped
			}, bob, Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000);

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(0);
			expect(result.skipped).toBe(false);

			const remainingNote = await notesRepository.findOneBy({ id: clippedNote.id });
			expect(remainingNote).not.toBeNull();
		});

		// ページ
		test('should not delete note that is embedded in a page', async () => {
			const job = createMockJob();

			// Create old remote note that is embedded in a page
			const clippedNote = await createNote({
				pageCount: 1, // Embedded in a page
			}, bob, Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000);

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(0);
			expect(result.skipped).toBe(false);

			const remainingNote = await notesRepository.findOneBy({ id: clippedNote.id });
			expect(remainingNote).not.toBeNull();
		});

		// 古いreply, renoteが含まれている時の挙動
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

			const remainingNotes = await notesRepository.find();
			expect(remainingNotes.some(n => n.id === oldNote.id)).toBe(true);
			expect(remainingNotes.some(n => n.id === recentReplyNote.id)).toBe(true); // Recent reply note should remain
		});

		// 古いリモートノートに新しいリプライと古いリプライがある時、全て残る
		test('should not delete old remote note with new reply and old reply', async () => {
			const job = createMockJob();

			// Create old remote note that should be deleted
			const oldNote = await createNote({}, bob, Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000);

			// Create a reply note that is newer than the expiry period
			const recentReplyNote = await createNote({
				replyId: oldNote.id,
			}, carol, Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) + 1000);

			// Create an old reply note that should be deleted
			const oldReplyNote = await createNote({
				replyId: oldNote.id,
			}, carol, Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 2000);

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(0);
			expect(result.skipped).toBe(false);

			const remainingNotes = await notesRepository.find();
			expect(remainingNotes.some(n => n.id === oldNote.id)).toBe(true);
			expect(remainingNotes.some(n => n.id === recentReplyNote.id)).toBe(true); // Recent reply note should remain
			expect(remainingNotes.some(n => n.id === oldReplyNote.id)).toBe(true); // Old reply note should be deleted
		});

		// リプライがお気に入りされているとき、どちらも削除されない
		test('should not delete reply note that is favorited', async () => {
			const job = createMockJob();

			// Create old remote note that should be deleted
			const olderRemoteNote = await createNote({}, bob, Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000);

			// Create a reply note that is newer than the expiry period
			const replyNote = await createNote({
				replyId: olderRemoteNote.id,
			}, carol, Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 2000);

			// Favorite the reply note
			await noteFavoritesRepository.save({
				id: idService.gen(),
				userId: alice.id,
				noteId: replyNote.id,
			});

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(0); // Only the old note should be deleted
			expect(result.skipped).toBe(false);

			const remainingNotes = await notesRepository.find();
			expect(remainingNotes.some(n => n.id === olderRemoteNote.id)).toBe(true);
			expect(remainingNotes.some(n => n.id === replyNote.id)).toBe(true); // Recent reply note should remain
		});

		// リプライがピン留めされているとき、どちらも削除されない
		test('should not delete reply note that is pinned', async () => {
			const job = createMockJob();

			// Create old remote note that should be deleted
			const olderRemoteNote = await createNote({}, bob, Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000);

			// Create a reply note that is newer than the expiry period
			const replyNote = await createNote({
				replyId: olderRemoteNote.id,
			}, carol, Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 2000);

			// Pin the reply note
			await userNotePiningsRepository.save({
				id: idService.gen(),
				userId: carol.id,
				noteId: replyNote.id,
			});

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(0); // Only the old note should be deleted
			expect(result.skipped).toBe(false);

			const remainingNotes = await notesRepository.find();
			expect(remainingNotes.some(n => n.id === olderRemoteNote.id)).toBe(true);
			expect(remainingNotes.some(n => n.id === replyNote.id)).toBe(true); // Reply note should remain
		});

		// リプライがクリップされているとき、どちらも削除されない
		test('should not delete reply note that is clipped', async () => {
			const job = createMockJob();

			// Create old remote note that should be deleted
			const olderRemoteNote = await createNote({}, bob, Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000);

			// Create a reply note that is old but clipped
			const replyNote = await createNote({
				replyId: olderRemoteNote.id,
				clippedCount: 1, // Clipped
			}, carol, Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 2000);

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(0); // Both notes should be kept because reply is clipped
			expect(result.skipped).toBe(false);

			const remainingNotes = await notesRepository.find();
			expect(remainingNotes.some(n => n.id === olderRemoteNote.id)).toBe(true);
			expect(remainingNotes.some(n => n.id === replyNote.id)).toBe(true);
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
			const newerRemoteNote = await createNote({}, bob);

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(1); // Only deletableNote should be deleted
			expect(result.skipped).toBe(false);

			const remainingNotes = await notesRepository.find();
			expect(remainingNotes.length).toBe(5);
			expect(remainingNotes.some(n => n.id === deletableNote.id)).toBe(false); // Deleted
			expect(remainingNotes.some(n => n.id === favoritedNote.id)).toBe(true); // Kept
			expect(remainingNotes.some(n => n.id === pinnedNote.id)).toBe(true); // Kept
			expect(remainingNotes.some(n => n.id === clippedNote.id)).toBe(true); // Kept
			expect(remainingNotes.some(n => n.id === localNote.id)).toBe(true); // Kept
			expect(remainingNotes.some(n => n.id === newerRemoteNote.id)).toBe(true); // Kept
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

			expect(result.deletedCount).toBe(0);
			expect(result.skipped).toBe(false);
		});

		// 大量の残す対象(clippedCount: 1)と大量の削除対象
		test('should handle large number of notes, mixed conditions with clippedCount', async () => {
			const AMOUNT_BASE = 70;
			const job = createMockJob();

			const oldTime = Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000;
			const noteIds = [];
			for (let i = 0; i < AMOUNT_BASE; i++) {
				const note = await createNote({ clippedCount: 1 }, bob, oldTime - i - AMOUNT_BASE);
				noteIds.push(note.id);
			}
			for (let i = 0; i < AMOUNT_BASE; i++) {
				const note = await createNote({}, carol, oldTime - i);
				noteIds.push(note.id);
			}

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(AMOUNT_BASE); // Assuming half are deletable
			expect(result.skipped).toBe(false);
		});

		// 大量の残す対象(リプライ)と大量の削除対象
		test('should handle large number of notes, mixed conditions with replies', async () => {
			const AMOUNT_BASE = 70;
			const job = createMockJob();
			const oldTime = Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000;
			const newTime = Date.now();
			for (let i = 0; i < AMOUNT_BASE; i++) {
				// should remain
				const note = await createNote({}, carol, oldTime - AMOUNT_BASE - i);
				// should remain
				await createNote({ replyId: note.id }, bob, newTime + i);
			}

			const noteIdsExpectedToBeDeleted = [];
			for (let i = 0; i < AMOUNT_BASE; i++) {
				// should be deleted
				const note = await createNote({}, bob, oldTime - i);
				noteIdsExpectedToBeDeleted.push(note.id);
			}

			const result = await service.process(job as any);
			expect(result.deletedCount).toBe(AMOUNT_BASE); // Assuming all replies are deletable
			expect(result.skipped).toBe(false);

			const remainingNotes = await notesRepository.find();
			expect(remainingNotes.length).toBe(AMOUNT_BASE * 2); // Only replies should remain
			noteIdsExpectedToBeDeleted.forEach(id => {
				expect(remainingNotes.some(n => n.id === id)).toBe(false); // All original notes should be deleted
			});
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

			// All three notes must be physically removed from the database
			const remainingNotes = await notesRepository.find();
			expect(remainingNotes.some(n => n.id === note1.id)).toBe(false);
			expect(remainingNotes.some(n => n.id === note2.id)).toBe(false);
			expect(remainingNotes.some(n => n.id === note3.id)).toBe(false);
		});
	});

	// region cursor / iteration (CleanRemoteNotesProcessorService.ts:99-107 minId, :302 cursor advance)
	// Verifies:
	//   1. The minId scan finds the oldest deletable note among irrelevant ones
	//   2. The main loop iterates multiple times when notes exceed currentLimit
	//   3. The cursor (cursorLeft) advances past unremovable trees and reaches deletables
	//      on the other side of the ID space
	describe('advanced - cursor and iteration', () => {
		const BATCH_LOG_RE = /^Deleted (\d+) notes;/;

		// Helper: count batch log entries ("Deleted N notes; Xms")
		const countBatchLogs = (job: ReturnType<typeof createMockJob>) =>
			(job.log as ReturnType<typeof vi.fn>).mock.calls.filter(
				(call: unknown[]) => typeof call[0] === 'string' && BATCH_LOG_RE.test(call[0] as string),
			).length;

		// 初期 currentLimit (100) を超えるノートでループが複数回回ることを検証
		test('should iterate multiple times when notes exceed currentLimit', async () => {
			const AMOUNT = 350;
			const oldTime = Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000;
			for (let i = 0; i < AMOUNT; i++) {
				await createNote({}, bob, oldTime - i);
			}

			const job = createMockJob();
			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(AMOUNT);
			expect(result.skipped).toBe(false);

			// バッチログが少なくとも 2 回（最低 currentLimit * 2 = 200 < 350 なので2回以上）
			expect(countBatchLogs(job)).toBeGreaterThanOrEqual(2);

			const remainingNotes = await notesRepository.find();
			expect(remainingNotes.length).toBe(0);
		}, 30 * 1000);

		// カーソルが「base には乗るが anti-join で残る」ブロックを通過して先の削除対象に到達することを検証
		// 注: clippedCount > 0 のような「base クエリで除外」される条件だと base に乗らずカーソルへの影響が見えないため、
		//     ここでは「base 自体は removalCriteria を満たすが、その子孫が unremovable のためツリーごと anti-join」を作る
		test('should advance cursor past anti-joined trees to reach deletables beyond', async () => {
			const oldTime = Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 100000;

			// ブロック A: 削除対象 50 件（最古 ID 群）
			const blockA: MiNote[] = [];
			for (let i = 0; i < 50; i++) {
				blockA.push(await createNote({}, bob, oldTime - 50000 - i));
			}

			// ブロック B: anti-join される 50 ツリー（base 自体は removalCriteria を満たす root + clip 済み reply）
			//   root は base 候補になるためカーソル前進に効くが、ツリーは isRemovable=FALSE で削除されない
			const blockBRoots: MiNote[] = [];
			const blockBReplies: MiNote[] = [];
			for (let i = 0; i < 50; i++) {
				const root = await createNote({}, bob, oldTime - 30000 - i * 2);
				const reply = await createNote({ replyId: root.id, clippedCount: 1 }, carol, oldTime - 30000 - i * 2 - 1);
				blockBRoots.push(root);
				blockBReplies.push(reply);
			}

			// ブロック C: 削除対象 50 件（最新 ID 群）
			const blockC: MiNote[] = [];
			for (let i = 0; i < 50; i++) {
				blockC.push(await createNote({}, carol, oldTime - 10000 - i));
			}

			const job = createMockJob();
			const result = await service.process(job as any);

			// A + C の 100 件が削除され、B のツリー（root + reply 計 100 件）は保持される
			expect(result.deletedCount).toBe(100);
			expect(result.skipped).toBe(false);

			const remainingNotes = await notesRepository.find();
			blockA.forEach(n => {
				expect(remainingNotes.some(r => r.id === n.id)).toBe(false);
			});
			blockBRoots.forEach(n => {
				expect(remainingNotes.some(r => r.id === n.id)).toBe(true);
			});
			blockBReplies.forEach(n => {
				expect(remainingNotes.some(r => r.id === n.id)).toBe(true);
			});
			blockC.forEach(n => {
				expect(remainingNotes.some(r => r.id === n.id)).toBe(false);
			});

			// カーソルが B の root 群を越えて C に到達した証として、複数回ループが回る
			expect(countBatchLogs(job)).toBeGreaterThanOrEqual(2);
		}, 30 * 1000);

		// minId が「削除対象ではないノートに埋もれた1件の削除対象」を正しく見つける
		test('should locate a single deletable note buried in irrelevant ones via minId scan', async () => {
			const newTime = Date.now();
			const oldTime = Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000;

			// 新しいリモートノート 50 件（newestLimit より新しいので minId 対象外）
			for (let i = 0; i < 50; i++) {
				await createNote({}, bob, newTime - i);
			}

			// 古いローカルノート 50 件（userHost IS NULL なので minId 対象外）
			for (let i = 0; i < 50; i++) {
				await createNote({}, alice, oldTime - i);
			}

			// 古いリプライ 50 件（replyId IS NOT NULL なので minId 対象外）
			//   親は新しいので、これら自体は CTE の base にもならない
			const parent = await createNote({}, bob);
			for (let i = 0; i < 50; i++) {
				await createNote({ replyId: parent.id }, bob, oldTime - 100 - i);
			}

			// 唯一の削除対象（古いリモート root ノート）
			const target = await createNote({}, bob, oldTime - 5000);

			const job = createMockJob();
			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(1);
			expect(result.skipped).toBe(false);
			expect(result.oldest).toBe(idService.parse(target.id).date.getTime());
			expect(result.newest).toBe(idService.parse(target.id).date.getTime());

			const remainingTarget = await notesRepository.findOneBy({ id: target.id });
			expect(remainingTarget).toBeNull();
		}, 30 * 1000);

		// 削除対象 → 保護 → 削除対象 → 保護 → ... が交互に並んでもカーソルが正しく進む
		test('should advance cursor correctly across interleaved deletable/protected notes', async () => {
			const oldTime = Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 10000;

			const deletables: MiNote[] = [];
			const protectedNotes: MiNote[] = [];

			// 250 件を 1ms 間隔で交互生成（カーソルが小刻みに進むことを期待）
			for (let i = 0; i < 250; i++) {
				if (i % 2 === 0) {
					deletables.push(await createNote({}, bob, oldTime - i));
				} else {
					protectedNotes.push(await createNote({ clippedCount: 1 }, bob, oldTime - i));
				}
			}

			const job = createMockJob();
			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(deletables.length);
			expect(result.skipped).toBe(false);

			const remainingNotes = await notesRepository.find();
			expect(remainingNotes.length).toBe(protectedNotes.length);
			deletables.forEach(n => {
				expect(remainingNotes.some(r => r.id === n.id)).toBe(false);
			});
			protectedNotes.forEach(n => {
				expect(remainingNotes.some(r => r.id === n.id)).toBe(true);
			});

			// 反復しないと交互配置をすべて捌けない（初期 currentLimit=100 < 250）
			expect(countBatchLogs(job)).toBeGreaterThanOrEqual(2);
		}, 30 * 1000);

		// 各バッチ内の最大 isBase ID が次バッチの cursorLeft になることを確認
		test('should not reprocess notes from a previous batch (cursor monotonicity)', async () => {
			const AMOUNT = 250;
			const oldTime = Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000;
			for (let i = 0; i < AMOUNT; i++) {
				await createNote({}, bob, oldTime - i);
			}

			const job = createMockJob();
			const result = await service.process(job as any);

			// 同じノートが二度カウントされないこと（厳密一致 = 単調増加カーソルが機能している）
			expect(result.deletedCount).toBe(AMOUNT);

			// バッチごとのログから削除数を合計してもズレがないこと
			const batchSizes = (job.log as ReturnType<typeof vi.fn>).mock.calls
				.map((call: unknown[]) => (typeof call[0] === 'string' ? call[0] as string : ''))
				.map((s: string) => s.match(BATCH_LOG_RE)?.[1])
				.filter((m): m is string => Boolean(m))
				.map((n: string) => Number(n));
			expect(batchSizes.length).toBeGreaterThanOrEqual(2);
			expect(batchSizes.reduce((a, b) => a + b, 0)).toBe(AMOUNT);
		}, 30 * 1000);
	});

	// region note_reaction protection (NOT EXISTS subquery with INNER JOIN on user.host IS NULL)
	// The removalCriteria condition is:
	//   NOT EXISTS (SELECT 1 FROM note_reaction INNER JOIN "user"
	//               ON note_reaction."userId" = "user".id
	//               WHERE note_reaction."noteId" = note."id"
	//               AND "user"."host" IS NULL)
	// i.e. only reactions from local users (host IS NULL) prevent deletion.
	describe('advanced - note_reaction', () => {
		// ローカルユーザーがリアクションしたノートは削除されない
		test('should not delete note that is reacted by a local user', async () => {
			const job = createMockJob();

			const olderRemoteNote = await createNote({}, bob, Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000);

			// alice (local) がリアクション
			await noteReactionsRepository.save({
				id: idService.gen(),
				userId: alice.id,
				noteId: olderRemoteNote.id,
				reaction: '👍',
			});

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(0);
			expect(result.skipped).toBe(false);

			const remainingNote = await notesRepository.findOneBy({ id: olderRemoteNote.id });
			expect(remainingNote).not.toBeNull();
		});

		// リモートユーザーだけがリアクションしたノートは削除される（保護対象ではない）
		test('should delete note that is reacted only by remote users', async () => {
			const job = createMockJob();

			const olderRemoteNote = await createNote({}, bob, Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000);

			// carol (remote) がリアクション
			await noteReactionsRepository.save({
				id: idService.gen(),
				userId: carol.id,
				noteId: olderRemoteNote.id,
				reaction: '👍',
			});

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(1);
			expect(result.skipped).toBe(false);

			const remainingNote = await notesRepository.findOneBy({ id: olderRemoteNote.id });
			expect(remainingNote).toBeNull();
		});

		// ローカル＋リモートが両方リアクション → ローカルがいる時点で削除されない
		test('should not delete note that has both local and remote reactions', async () => {
			const job = createMockJob();

			const olderRemoteNote = await createNote({}, bob, Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000);

			await noteReactionsRepository.save([
				{
					id: idService.gen(),
					userId: alice.id, // local
					noteId: olderRemoteNote.id,
					reaction: '👍',
				},
				{
					id: idService.gen(),
					userId: carol.id, // remote
					noteId: olderRemoteNote.id,
					reaction: '❤️',
				},
			]);

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(0);
			expect(result.skipped).toBe(false);

			const remainingNote = await notesRepository.findOneBy({ id: olderRemoteNote.id });
			expect(remainingNote).not.toBeNull();
		});

		// ルートにローカルリアクション → そもそも base に乗らずツリー全体が残る
		test('should retain whole tree when root has local user reaction', async () => {
			const job = createMockJob();
			const oldTime = Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000;

			const root = await createNote({}, bob, oldTime);
			const reply = await createNote({ replyId: root.id }, carol, oldTime - 1000);

			// root にローカルユーザーがリアクション
			await noteReactionsRepository.save({
				id: idService.gen(),
				userId: alice.id,
				noteId: root.id,
				reaction: '👍',
			});

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(0);
			expect(result.skipped).toBe(false);

			const remainingNotes = await notesRepository.find();
			expect(remainingNotes.some(n => n.id === root.id)).toBe(true);
			expect(remainingNotes.some(n => n.id === reply.id)).toBe(true);
		});

		// リプライにローカルリアクション → 親（root）も anti-join により残る
		test('should retain whole tree when a reply has a local user reaction', async () => {
			const job = createMockJob();
			const oldTime = Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000;

			const root = await createNote({}, bob, oldTime);
			const reply = await createNote({ replyId: root.id }, carol, oldTime - 1000);

			// reply にローカルユーザーがリアクション
			await noteReactionsRepository.save({
				id: idService.gen(),
				userId: alice.id,
				noteId: reply.id,
				reaction: '🎉',
			});

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(0);
			expect(result.skipped).toBe(false);

			const remainingNotes = await notesRepository.find();
			expect(remainingNotes.some(n => n.id === root.id)).toBe(true);
			expect(remainingNotes.some(n => n.id === reply.id)).toBe(true);
		});

		// リプライのリアクションがリモートのみ → ツリー全体が削除される
		test('should delete whole tree when reactions are only from remote users', async () => {
			const job = createMockJob();
			const oldTime = Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000;

			const root = await createNote({}, bob, oldTime);
			const reply = await createNote({ replyId: root.id }, carol, oldTime - 1000);

			// root と reply それぞれに リモートユーザーがリアクション
			await noteReactionsRepository.save([
				{
					id: idService.gen(),
					userId: carol.id, // remote
					noteId: root.id,
					reaction: '👍',
				},
				{
					id: idService.gen(),
					userId: bob.id, // remote
					noteId: reply.id,
					reaction: '❤️',
				},
			]);

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(2);
			expect(result.skipped).toBe(false);

			const remainingNotes = await notesRepository.find();
			expect(remainingNotes.some(n => n.id === root.id)).toBe(false);
			expect(remainingNotes.some(n => n.id === reply.id)).toBe(false);
		});

		// 深いリプライツリーの末端にローカルリアクション → ツリー全体保護
		test('should retain a deep reply tree when the deepest reply has a local reaction', async () => {
			const job = createMockJob();
			const oldTime = Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000;

			const root = await createNote({}, bob, oldTime);
			const r1 = await createNote({ replyId: root.id }, carol, oldTime - 1000);
			const r2 = await createNote({ replyId: r1.id }, bob, oldTime - 2000);
			const r3 = await createNote({ replyId: r2.id }, carol, oldTime - 3000);

			// 末端 r3 にローカルリアクション
			await noteReactionsRepository.save({
				id: idService.gen(),
				userId: alice.id,
				noteId: r3.id,
				reaction: '👍',
			});

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(0);
			expect(result.skipped).toBe(false);

			const remainingNotes = await notesRepository.find();
			expect(remainingNotes.length).toBe(4);
		});

		// 削除可能ノートとローカルリアクションで保護されたノートが混在
		test('should keep reacted notes and delete others in a mixed batch', async () => {
			const job = createMockJob();
			const oldTime = Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000;

			const deletables: MiNote[] = [];
			const protectedByLocalReaction: MiNote[] = [];
			for (let i = 0; i < 5; i++) {
				deletables.push(await createNote({}, bob, oldTime - i));
			}
			for (let i = 0; i < 5; i++) {
				const n = await createNote({}, carol, oldTime - 100 - i);
				await noteReactionsRepository.save({
					id: idService.gen(),
					userId: alice.id, // local
					noteId: n.id,
					reaction: '👍',
				});
				protectedByLocalReaction.push(n);
			}

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(5);
			expect(result.skipped).toBe(false);

			const remainingNotes = await notesRepository.find();
			deletables.forEach(n => {
				expect(remainingNotes.some(r => r.id === n.id)).toBe(false);
			});
			protectedByLocalReaction.forEach(n => {
				expect(remainingNotes.some(r => r.id === n.id)).toBe(true);
			});
		});
	});

	// region maxDuration cutoff (CleanRemoteNotesProcessorService.ts:200-204)
	describe('advanced - maxDuration', () => {
		test('should stop processing when maxDuration is reached', async () => {
			// 6ms 程度。初回バッチ後にループ先頭の経過時間チェックで必ず超過する
			meta.remoteNotesCleaningMaxProcessingDurationInMinutes = 0.0001;

			const AMOUNT = 250;
			const oldTime = Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000;
			for (let i = 0; i < AMOUNT; i++) {
				await createNote({}, bob, oldTime - i);
			}

			const job = createMockJob();
			const result = await service.process(job as any);

			// maxDuration が極小なので、少なくとも 1 回はループ先頭の時間チェックで break する。
			// （削除件数の上限はバッチサイズ・DB の速さに依存して timing-fragile になりやすいため、
			// ここでは "Reached maximum duration" ログが出ていることのみを functional な保証とする）
			expect(result.skipped).toBe(false);
			expect(job.log).toHaveBeenCalledWith(expect.stringContaining('Reached maximum duration'));
			expect(job.updateProgress).toHaveBeenCalledWith(100);

			// 削除件数と残件数の総和が AMOUNT と一致
			const remainingNotes = await notesRepository.find();
			expect(remainingNotes.length + result.deletedCount).toBe(AMOUNT);
		}, 30 * 1000);
	});

	// region early return / dynamic config (CleanRemoteNotesProcessorService.ts:99-117 / 188-192)
	describe('advanced - early return / dynamic config', () => {
		// minId クエリが対象ノートを見つけられない → 即 early return
		test('should early-return when no old root remote note exists (only new root with old descendants)', async () => {
			const job = createMockJob();
			const newTime = Date.now();
			const oldTime = Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000;

			// 新しい root（残る）
			const newRoot = await createNote({}, bob, newTime);
			// 古い reply（root が新しいので CTE に乗らない）
			const oldReply = await createNote({ replyId: newRoot.id }, carol, oldTime);

			const result = await service.process(job as any);

			expect(result).toEqual({
				deletedCount: 0,
				oldest: null,
				newest: null,
				skipped: false,
				transientErrors: 0,
			});

			const remainingNotes = await notesRepository.find();
			expect(remainingNotes.some(n => n.id === newRoot.id)).toBe(true);
			expect(remainingNotes.some(n => n.id === oldReply.id)).toBe(true);
		});

		// 古い root の親が全部 unremovable（クリップ済み） → minId は見つかるが CTE 空、ループ即終了
		test('should exit loop when all old root notes are unremovable', async () => {
			const job = createMockJob();
			const oldTime = Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000;

			// 全部 clip 済み（unremovable）
			for (let i = 0; i < 5; i++) {
				await createNote({ clippedCount: 1 }, bob, oldTime - i);
			}

			const result = await service.process(job as any);

			expect(result.deletedCount).toBe(0);
			expect(result.skipped).toBe(false);

			const remainingNotes = await notesRepository.find();
			expect(remainingNotes.length).toBe(5);
		});

		// 処理中に enableRemoteNotesCleaning が false にされたらループを抜ける
		test('should stop processing when enableRemoteNotesCleaning is disabled mid-process', async () => {
			const AMOUNT = 250;
			const oldTime = Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000;
			for (let i = 0; i < AMOUNT; i++) {
				await createNote({}, bob, oldTime - i);
			}

			const job = createMockJob();
			// updateProgress は各ループ先頭で呼ばれるので、初回呼び出しで disable する
			let disabledAt = -1;
			job.updateProgress = vi.fn(() => {
				if (disabledAt === -1) {
					meta.enableRemoteNotesCleaning = false;
					disabledAt = Date.now();
				}
			});

			const result = await service.process(job as any);

			expect(result.skipped).toBe(false);
			expect(result.deletedCount).toBeGreaterThan(0);
			expect(result.deletedCount).toBeLessThan(AMOUNT);
		}, 30 * 1000);
	});

	// region chaos / all protection conditions combined
	describe('advanced - chaos', () => {
		test('should respect every protection condition simultaneously', async () => {
			const job = createMockJob();
			const oldTime = Date.now() - ms(`${meta.remoteNotesCleaningExpiryDaysForEachNotes} days`) - 1000;

			// 1) 単純な古いリモートノート → 削除される
			const plainDeletable = await createNote({}, bob, oldTime);

			// 2) お気に入り保護
			const favorited = await createNote({}, bob, oldTime - 1);
			await noteFavoritesRepository.save({
				id: idService.gen(),
				userId: alice.id,
				noteId: favorited.id,
			});

			// 3) ピン留め保護
			const pinned = await createNote({}, bob, oldTime - 2);
			await userNotePiningsRepository.save({
				id: idService.gen(),
				userId: bob.id,
				noteId: pinned.id,
			});

			// 4) クリップ保護
			const clipped = await createNote({ clippedCount: 1 }, bob, oldTime - 3);

			// 5) ページ保護
			const paged = await createNote({ pageCount: 1 }, bob, oldTime - 4);

			// 6) ローカルリアクション保護
			const reactedByLocal = await createNote({}, bob, oldTime - 5);
			await noteReactionsRepository.save({
				id: idService.gen(),
				userId: alice.id,
				noteId: reactedByLocal.id,
				reaction: '👍',
			});

			// 7) リモートのみリアクション → 保護されない（削除される）
			const reactedByRemote = await createNote({}, bob, oldTime - 6);
			await noteReactionsRepository.save({
				id: idService.gen(),
				userId: carol.id, // remote
				noteId: reactedByRemote.id,
				reaction: '👍',
			});

			// 8) ローカルノート → 削除されない
			const localOldNote = await createNote({}, alice, oldTime - 7);

			// 9) 新しいリモートノート → 削除されない
			const newRemoteNote = await createNote({}, bob);

			// 10) 古い root に新しい reply が付いた → ツリー全体残る
			const oldRootWithNewReply = await createNote({}, carol, oldTime - 8);
			const newReplyOfOldRoot = await createNote({ replyId: oldRootWithNewReply.id }, bob);

			// 11) 古い root に古い reply（両方削除対象） → ツリーごと削除
			const oldTreeRoot = await createNote({}, bob, oldTime - 9);
			const oldTreeReply = await createNote({ replyId: oldTreeRoot.id }, carol, oldTime - 10);

			// 12) 古い root + 古い reply, reply にローカルリアクション → ツリー保護
			const protectedTreeRoot = await createNote({}, bob, oldTime - 11);
			const protectedTreeReply = await createNote({ replyId: protectedTreeRoot.id }, carol, oldTime - 12);
			await noteReactionsRepository.save({
				id: idService.gen(),
				userId: alice.id,
				noteId: protectedTreeReply.id,
				reaction: '✨',
			});

			const result = await service.process(job as any);

			// 削除されるべき: plainDeletable, reactedByRemote, oldTreeRoot, oldTreeReply → 4 件
			expect(result.deletedCount).toBe(4);
			expect(result.skipped).toBe(false);

			const remainingNotes = await notesRepository.find();

			const expectDeleted = [plainDeletable, reactedByRemote, oldTreeRoot, oldTreeReply];
			const expectKept = [
				favorited, pinned, clipped, paged, reactedByLocal, localOldNote,
				newRemoteNote, oldRootWithNewReply, newReplyOfOldRoot,
				protectedTreeRoot, protectedTreeReply,
			];

			expectDeleted.forEach(n => {
				expect(remainingNotes.some(r => r.id === n.id)).toBe(false);
			});
			expectKept.forEach(n => {
				expect(remainingNotes.some(r => r.id === n.id)).toBe(true);
			});
		});
	});
});
