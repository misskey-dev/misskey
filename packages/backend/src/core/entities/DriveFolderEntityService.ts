/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { DriveFilesRepository, DriveFoldersRepository } from '@/models/_.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/json-schema.js';
import type { } from '@/models/Blocking.js';
import type { MiDriveFolder } from '@/models/DriveFolder.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';

@Injectable()
export class DriveFolderEntityService {
	constructor(
		@Inject(DI.driveFoldersRepository)
		private driveFoldersRepository: DriveFoldersRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private idService: IdService,
	) {
	}

	@bindThis
	public async pack(
		src: MiDriveFolder['id'] | MiDriveFolder,
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
			createdAt: this.idService.parse(folder.id).date.toISOString(),
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

