/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'crypto';
import ms from 'ms';
import * as Redis from 'ioredis';
import { Inject, Injectable } from '@nestjs/common';
import type { DriveFilesRepository } from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';
import { DI } from '@/di-symbols.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { DriveService } from '@/core/DriveService.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { LoggerService } from '@/core/LoggerService.js';

export const meta = {
	tags: ['drive'],

	requireCredential: true,
	requireRolePolicy: 'canCreateContent',

	prohibitMoved: true,

	limit: {
		duration: ms('1hour'),
		max: 60,
	},

	kind: 'write:drive',
	description: 'Request the server to download a new drive file from the specified URL.',

	errors: {
		processing: {
			message: 'We are processing your request. Please wait a moment.',
			code: 'PROCESSING',
			id: '59953963-7b7a-4b6a-b74b-2e9f86992b04',
			httpStatusCode: 202,
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		url: { type: 'string' },
		folderId: { type: 'string', format: 'misskey:id', nullable: true, default: null },
		isSensitive: { type: 'boolean', default: false },
		comment: { type: 'string', nullable: true, maxLength: 512, default: null },
		marker: { type: 'string', nullable: true, default: null },
		force: { type: 'boolean', default: false },
	},
	required: ['url'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private loggerService: LoggerService,
		private driveService: DriveService,
		private driveFileEntityService: DriveFileEntityService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me, _token, _file, _cleanup, ip, headers) => {
			const logger = this.loggerService.getLogger('api:drive:files:upload-from-url');
			const hash = createHash('sha256').update(`${ps.folderId}:${ps.url}:${ps.isSensitive}`).digest('base64');
			logger.setContext({ userId: me.id, hash, ip, headers });
			logger.info('Request to upload from URL.');

			const idempotent = process.env.FORCE_IGNORE_IDEMPOTENCY_FOR_TESTING !== 'true' ? await this.redisClient.get(`drive:files:upload-from-url:idempotent:${me.id}:${hash}`) : null;
			if (idempotent === '_') { // 他のサーバーで処理中
				logger.warn('The request is being processed by another server.');
				throw new ApiError(meta.errors.processing);
			}

			// すでに同じリクエストが処理されている場合、そのファイルを返す
			// ただし、記録されているファイルが見つからない場合は、新規として処理を続行
			if (idempotent) {
				const file = await this.driveFilesRepository.findOneBy({ id: idempotent });
				if (file) {
					logger.info('The request has already been processed.', { fileId: file.id });
					return;
				}
			}

			// 30秒の間、リクエストを処理中として記録
			await this.redisClient.set(`drive:files:upload-from-url:idempotent:${me.id}:${hash}`, '_', 'EX', 30);

			this.driveService.uploadFromUrl({
				url: ps.url,
				user: me,
				folderId: ps.folderId,
				sensitive: ps.isSensitive,
				force: ps.force,
				comment: ps.comment,
				requestIp: ip,
				requestHeaders: headers,
			}).then(
				async file => {
					// 1分間、リクエストの処理結果を記録
					await this.redisClient.set(`drive:files:upload-from-url:idempotent:${me.id}:${hash}`, file.id, 'EX', 60);
					logger.info('Successfully uploaded from URL.', { fileId: file.id });

					this.driveFileEntityService.pack(file, me, { self: true }).then(packedFile => {
						this.globalEventService.publishMainStream(me.id, 'urlUploadFinished', {
							marker: ps.marker,
							file: packedFile,
						});
					});
				},
				async err => {
					// エラーが発生した場合、まだ処理中として記録されている場合はリクエストの処理結果を削除
					await this.redisClient.unlinkIf(`drive:files:upload-from-url:idempotent:${me.id}:${hash}`, '_');
					logger.error('Failed to upload from URL.', { error: err });
				},
			);
		});
	}
}
