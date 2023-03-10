process.env.NODE_ENV = 'test';

import { jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { GlobalModule } from '@/GlobalModule.js';
import { DriveService } from '@/core/DriveService.js';
import { CoreModule } from '@/core/CoreModule.js';
import { S3Service } from '@/core/S3Service';
import type { Meta } from '@/models';
import type { DeleteObjectOutput } from 'aws-sdk/clients/s3';
import type { AWSError } from 'aws-sdk/lib/error';
import type { PromiseResult, Request } from 'aws-sdk/lib/request';
import type { TestingModule } from '@nestjs/testing';

describe('DriveService', () => {
	let app: TestingModule;
	let driveService: DriveService;

	beforeEach(async () => {
		app = await Test.createTestingModule({
			imports: [GlobalModule, CoreModule],
			providers: [DriveService, S3Service],
		}).compile();
		app.enableShutdownHooks();
		driveService = app.get<DriveService>(DriveService);

		const s3Service = app.get<S3Service>(S3Service);
		const s3 = s3Service.getS3({} as Meta);

		// new S3() surprisingly does not return an instance of class S3.
		// Let's use getPrototypeOf here to get a real prototype, since spying on S3.prototype doesn't work.
		// TODO: Use `aws-sdk-client-mock` package when upgrading to AWS SDK v3.
		jest.spyOn(Object.getPrototypeOf(s3), 'deleteObject').mockImplementation(() => {
			// Roughly mock AWS request object
			return {
				async promise(): Promise<PromiseResult<DeleteObjectOutput, AWSError>> {
					const err = new Error('mock') as AWSError;
					err.code = 'NoSuchKey';
					throw err;
				},
			} as Request<DeleteObjectOutput, AWSError>;
		});
	});

	describe('Object storage', () => {
		test('delete a file with no valid key', async () => {
			try {
				await driveService.deleteObjectStorageFile('lol no way');
			} catch (err: any) {
				console.log(err.cause);
				throw err;
			}
		});
	});
});
