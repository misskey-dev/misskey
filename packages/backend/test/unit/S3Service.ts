/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { Test } from '@nestjs/testing';
import { UploadPartCommand, CompleteMultipartUploadCommand, CreateMultipartUploadCommand, S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { GlobalModule } from '@/GlobalModule.js';
import { CoreModule } from '@/core/CoreModule.js';
import { S3Service } from '@/core/S3Service.js';
import { MiMeta } from '@/models/_.js';
import type { TestingModule } from '@nestjs/testing';

describe('S3Service', () => {
	let app: TestingModule;
	let s3Service: S3Service;
	const s3Mock = mockClient(S3Client);

	beforeAll(async () => {
		app = await Test.createTestingModule({
			imports: [GlobalModule, CoreModule],
			providers: [S3Service],
		}).compile();
		app.enableShutdownHooks();
		s3Service = app.get<S3Service>(S3Service);
	});

	beforeEach(async () => {
		s3Mock.reset();
	});

	afterAll(async () => {
		await app.close();
	});

	describe('upload', () => {
		test('upload a file', async () => {
			s3Mock.on(PutObjectCommand).resolves({});

			await s3Service.upload({ objectStorageRegion: 'us-east-1' } as MiMeta, {
				Bucket: 'fake',
				Key: 'fake',
				Body: 'x',
			});
		});

		test('upload a large file', async () => {
			s3Mock.on(CreateMultipartUploadCommand).resolves({ UploadId: '1' });
			s3Mock.on(UploadPartCommand).resolves({ ETag: '1' });
			s3Mock.on(CompleteMultipartUploadCommand).resolves({ Bucket: 'fake', Key: 'fake' });

			await s3Service.upload({} as MiMeta, {
				Bucket: 'fake',
				Key: 'fake',
				Body: 'x'.repeat(8 * 1024 * 1024 + 1), // デフォルトpartSizeにしている 8 * 1024 * 1024 を越えるサイズ
			});
		});

		test('upload a file error', async () => {
			s3Mock.on(PutObjectCommand).rejects({ name: 'Fake Error' });

			await expect(s3Service.upload({ objectStorageRegion: 'us-east-1' } as MiMeta, {
				Bucket: 'fake',
				Key: 'fake',
				Body: 'x',
			})).rejects.toThrowError(Error);
		});

		test('upload a large file error', async () => {
			s3Mock.on(UploadPartCommand).rejects();

			await expect(s3Service.upload({} as MiMeta, {
				Bucket: 'fake',
				Key: 'fake',
				Body: 'x'.repeat(8 * 1024 * 1024 + 1), // デフォルトpartSizeにしている 8 * 1024 * 1024 を越えるサイズ
			})).rejects.toThrowError(Error);
		});
	});
});
