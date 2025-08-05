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
			meta.enableRemoteNotesCleaning = true;
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
			meta.enableRemoteNotesCleaning = true;

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

	// TODO: Add more tests...
});
