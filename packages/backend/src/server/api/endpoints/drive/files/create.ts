import { Inject, Injectable } from '@nestjs/common';
import type { DriveFilesRepository } from '@/models/index.js';
import { DB_MAX_IMAGE_COMMENT_LENGTH } from '@/const.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { MetaService } from '@/core/MetaService.js';
import { DriveService } from '@/core/DriveService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'drive/files/create'> {
	name = 'drive/files/create' as const;
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveFileEntityService: DriveFileEntityService,
		private metaService: MetaService,
		private driveService: DriveService,
	) {
		super(async (ps, me, _, file, cleanup, ip, headers) => {
			if (ps.comment != null && ps.comment.length > DB_MAX_IMAGE_COMMENT_LENGTH) {
				throw new ApiError(this.meta.errors.commentTooLong);
			}

			// Get 'name' parameter
			let name = ps.name ?? file!.name ?? null;
			if (name != null) {
				name = name.trim();
				if (name.length === 0) {
					name = null;
				} else if (name === 'blob') {
					name = null;
				} else if (!this.driveFileEntityService.validateFileName(name)) {
					throw new ApiError(this.meta.errors.invalidFileName);
				}
			}

			const instance = await this.metaService.fetch();

			try {
				// Create file
				const driveFile = await this.driveService.addFile({
					user: me,
					path: file!.path,
					name,
					comment: ps.comment,
					folderId: ps.folderId,
					force: ps.force,
					sensitive: ps.isSensitive,
					requestIp: instance.enableIpLogging ? ip : null,
					requestHeaders: instance.enableIpLogging ? headers : null,
				});
				return await this.driveFileEntityService.pack(driveFile, { self: true });
			} catch (err) {
				if (err instanceof Error || typeof err === 'string') {
					console.error(err);
				}
				if (err instanceof IdentifiableError) {
					if (err.id === '282f77bf-5816-4f72-9264-aa14d8261a21') throw new ApiError(this.meta.errors.inappropriate);
					if (err.id === 'c6244ed2-a39a-4e1c-bf93-f0fbd7764fa6') throw new ApiError(this.meta.errors.noFreeSpace);
				}
				throw new ApiError();
			} finally {
				cleanup!();
			}
		});
	}
}
