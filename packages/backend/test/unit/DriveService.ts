process.env.NODE_ENV = 'test';

import { addCoreServices } from '@/boot/CoreModule.js';
import { addGlobalServices, initializeGlobalServices } from '@/boot/GlobalModule.js';
import { addQueueServices } from '@/boot/QueueModule.js';
import { addRepositoryServices } from '@/boot/RepositoryModule.js';
import { DriveService } from '@/core/DriveService.js';
import { S3Service } from '@/core/S3Service';
import { DI } from '@/di-symbols';
import type { Meta } from '@/models';
import type { DeleteObjectOutput } from 'aws-sdk/clients/s3';
import type { AWSError } from 'aws-sdk/lib/error';
import type { PromiseResult, Request } from 'aws-sdk/lib/request';
import { afterEach, beforeEach, describe, test, vi } from 'vitest';
import { addSingletonCtor, buildServiceProvider, getRequiredService, ServiceCollection, ServiceProvider } from 'yohira';

describe('DriveService', () => {
	let serviceProvider: ServiceProvider;
	let driveService: DriveService;

	beforeEach(async () => {
		const services = new ServiceCollection();
		addGlobalServices(services);
		addRepositoryServices(services);
		addQueueServices(services);
		addCoreServices(services);
		addSingletonCtor(services, DI.DriveService, DriveService);
		addSingletonCtor(services, DI.S3Service, S3Service);

		serviceProvider = buildServiceProvider(services);

		await initializeGlobalServices(serviceProvider);

		driveService = getRequiredService<DriveService>(serviceProvider, DI.DriveService);

		const s3Service = getRequiredService<S3Service>(serviceProvider, DI.S3Service);
		const s3 = s3Service.getS3({} as Meta);

		// new S3() surprisingly does not return an instance of class S3.
		// Let's use getPrototypeOf here to get a real prototype, since spying on S3.prototype doesn't work.
		// TODO: Use `aws-sdk-client-mock` package when upgrading to AWS SDK v3.
		vi.spyOn(Object.getPrototypeOf(s3), 'deleteObject').mockImplementation(() => {
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

	afterEach(async () => {
		await serviceProvider.disposeAsync();
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
