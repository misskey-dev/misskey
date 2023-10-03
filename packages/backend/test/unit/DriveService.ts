/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { Test } from '@nestjs/testing';
import { DeleteObjectCommandOutput, DeleteObjectCommand, NoSuchKey, InvalidObjectState, S3Client } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { GlobalModule } from '@/GlobalModule.js';
import { DriveService } from '@/core/DriveService.js';
import { CoreModule } from '@/core/CoreModule.js';
import type { TestingModule } from '@nestjs/testing';

describe('DriveService', () => {
	let app: TestingModule;
	let driveService: DriveService;
	const s3Mock = mockClient(S3Client);

	beforeAll(async () => {
		app = await Test.createTestingModule({
			imports: [GlobalModule, CoreModule],
			providers: [DriveService],
		}).compile();
		app.enableShutdownHooks();
		driveService = app.get<DriveService>(DriveService);
	});

	beforeEach(async () => {
		s3Mock.reset();
	});

	afterAll(async () => {
		await app.close();
	});

	describe('Object storage', () => {
		test('delete a file', async () => {
			s3Mock.on(DeleteObjectCommand)
				.resolves({} as DeleteObjectCommandOutput);

			await driveService.deleteObjectStorageFile('peace of the world');
		});

		test('delete a file then unexpected error', async () => {
			s3Mock.on(DeleteObjectCommand)
				.rejects(new InvalidObjectState({ $metadata: {}, message: '' }));

			await expect(driveService.deleteObjectStorageFile('unexpected')).rejects.toThrowError(Error);
		});

		test('delete a file with no valid key', async () => {
			// Some S3 implementations returns 404 Not Found on deleting with a non-existent key
			s3Mock.on(DeleteObjectCommand)
				.rejects(new NoSuchKey({ $metadata: {}, message: 'allowed error.' }));

			await driveService.deleteObjectStorageFile('lol no way');
		});
	});
});
