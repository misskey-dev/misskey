/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import { createHash } from 'crypto';
import * as stream from 'node:stream/promises';
import * as Redis from 'ioredis';
import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import type { DriveFilesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { DriveService } from '@/core/DriveService.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { DB_MAX_IMAGE_COMMENT_LENGTH } from '@/const.js';
import { LoggerService } from '@/core/LoggerService.js';
import { MetaService } from '@/core/MetaService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['drive'],

	requireCredential: true,
	requireRolePolicy: 'canCreateContent',

	prohibitMoved: true,

	limit: {
		duration: ms('1hour'),
		max: 120,
	},

	requireFile: true,

	kind: 'write:drive',
	description: 'Upload a new drive file.',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'DriveFile',
	},

	errors: {
		invalidParam: {
			message: 'Invalid param.',
			code: 'INVALID_PARAM',
			id: 'b2da4a73-a9d2-44e5-a81b-28e796874fc3',
		},

		processing: {
			message: 'We are processing your request. Please wait a moment.',
			code: 'PROCESSING',
			id: 'b495d816-b077-4dc1-b135-7fde73fcca5e',
			httpStatusCode: 202,
		},

		invalidFileName: {
			message: 'Invalid file name.',
			code: 'INVALID_FILE_NAME',
			id: 'f449b209-0c60-4e51-84d5-29486263bfd4',
		},

		inappropriate: {
			message: 'Cannot upload the file because it has been determined that it possibly contains inappropriate content.',
			code: 'INAPPROPRIATE',
			id: 'bec5bd69-fba3-43c9-b4fb-2894b66ad5d2',
		},

		noFreeSpace: {
			message: 'Cannot upload the file because you have no free space of drive.',
			code: 'NO_FREE_SPACE',
			id: 'd08dbc37-a6a9-463a-8c47-96c32ab5f064',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		folderId: { type: 'string', format: 'misskey:id', nullable: true, default: null },
		name: { type: 'string', nullable: true, default: null },
		comment: { type: 'string', nullable: true, maxLength: DB_MAX_IMAGE_COMMENT_LENGTH, default: null },
		isSensitive: { type: 'boolean', default: false },
		force: { type: 'boolean', default: false },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveFileEntityService: DriveFileEntityService,
		private metaService: MetaService,
		private loggerService: LoggerService,
		private driveService: DriveService,
	) {
		super(meta, paramDef, async (ps, me, _, file, cleanup, ip, headers) => {
			const logger = this.loggerService.getLogger('api:drive:files:create');

			if (!file) {
				logger.setContext({ userId: me.id, ip, headers });
				logger.error('File is required but did not provided.');
				throw new ApiError(meta.errors.invalidParam);
			}

			const calcHash = createHash('sha256').update(`${ps.folderId}:${ps.isSensitive}`);
			await stream.pipeline(fs.createReadStream(file.path, { encoding: 'binary', start: 0, end: 1024 * 1024 }), calcHash);
			const hash = calcHash.digest('base64');
			logger.setContext({ userId: me.id, hash, ip, headers });
			logger.info('Request to create drive file.');

			const idempotent = process.env.FORCE_IGNORE_IDEMPOTENCY_FOR_TESTING !== 'true' ? await this.redisClient.get(`drive:files:create:idempotent:${me.id}:${hash}`) : null;
			if (idempotent === '_') { // 他のサーバーで処理中
				logger.warn('The request is being processed by another server.');
				throw new ApiError(meta.errors.processing);
			}

			// すでに同じリクエストが処理されている場合、そのファイルを返す
			// ただし、記録されているファイルが見つからない場合は、新規として処理を続行
			if (idempotent) {
				const driveFile = await this.driveFilesRepository.findOneBy({ id: idempotent });
				if (driveFile) {
					logger.info('The request has already been processed.', { fileId: driveFile.id });
					return await this.driveFileEntityService.pack(driveFile, me, { self: true });
				}
			}

			// 30秒の間、リクエストを処理中として記録
			await this.redisClient.set(`drive:files:create:idempotent:${me.id}:${hash}`, '_', 'EX', 30);

			// Get 'name' parameter
			let name = ps.name ?? file.name ?? null;
			if (name != null) {
				name = name.trim();
				if (name.length === 0) {
					name = null;
				} else if (name === 'blob') {
					name = null;
				} else if (!this.driveFileEntityService.validateFileName(name)) {
					throw new ApiError(meta.errors.invalidFileName);
				}
			}

			const instance = await this.metaService.fetch();

			try {
				// Create file
				const driveFile = await this.driveService.addFile({
					user: me,
					path: file.path,
					name,
					comment: ps.comment,
					folderId: ps.folderId,
					force: ps.force,
					sensitive: ps.isSensitive,
					requestIp: instance.enableIpLogging ? ip : null,
					requestHeaders: instance.enableIpLogging ? headers : null,
				});

				// 1分間、リクエストの処理結果を記録
				await this.redisClient.set(`drive:files:create:idempotent:${me.id}:${hash}`, driveFile.id, 'EX', 60);

				logger.info('Successfully created drive file.', { fileId: driveFile.id });
				return await this.driveFileEntityService.pack(driveFile, me, { self: true });
			} catch (e) {
				// エラーが発生した場合、リクエストの処理結果を削除
				await this.redisClient.unlink(`drive:files:create:idempotent:${me.id}:${hash}`);

				logger.error('Failed to create drive file.', { error: e });

				if (e instanceof IdentifiableError) {
					if (e.id === '282f77bf-5816-4f72-9264-aa14d8261a21') throw new ApiError(meta.errors.inappropriate);
					if (e.id === 'c6244ed2-a39a-4e1c-bf93-f0fbd7764fa6') throw new ApiError(meta.errors.noFreeSpace);
				}

				const err = e as Error;
				throw new ApiError(
					{
						message: 'Failed to create drive file.',
						code: 'FAILED_TO_CREATE_DRIVE_FILE',
						id: '6708863c-6791-4487-aa01-2d682c6e7db0',
					},
					{
						e: {
							message: err.message,
							code: err.name,
						},
					},
				);
			} finally {
				if (cleanup) cleanup();
			}
		});
	}
}
