/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { DriveFilesRepository, DriveFoldersRepository } from '@/models/index.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/json-schema.js';
import type { } from '@/models/entities/Blocking.js';
import type { DriveFolder } from '@/models/entities/DriveFolder.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class DriveFolderEntityService {
	constructor(
		@Inject(DI.driveFoldersRepository)
		private driveFoldersRepository: DriveFoldersRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,
	) {
	}

	@bindThis
	public async pack(
		src: DriveFolder['id'] | DriveFolder,
		options?: {
			detail: boolean
		},
	): Promise<Packed<'DriveFolder'>> {
		const opts = Object.assign({
			detail: false,
		}, options);

		const folder = typeof src === 'object' ? src : await this.driveFoldersRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: folder.id,
			createdAt: folder.createdAt.toISOString(),
			name: folder.name,
			parentId: folder.parentId,

			...(opts.detail ? {
				foldersCount: this.driveFoldersRepository.countBy({
					parentId: folder.id,
				}),
				filesCount: this.driveFilesRepository.countBy({
					folderId: folder.id,
				}),

				...(folder.parentId ? {
					parent: this.pack(folder.parentId, {
						detail: true,
					}),
				} : {}),
			} : {}),
		});
	}
}

