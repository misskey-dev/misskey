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
import { In } from 'typeorm';
import { uniqueByKey } from '@/misc/unique-by-key.js';
import { splitIdAndObjects } from '@/misc/split-id-and-objects.js';

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
		hint?: {
			folderMap?: Map<string, MiDriveFolder>;
			foldersCountMap?: Map<string, number> | null;
			filesCountMap?: Map<string, number> | null;
			parentPacker?: (id: string) => Promise<Packed<'DriveFolder'>>;
		},
	): Promise<Packed<'DriveFolder'>> {
		const opts = Object.assign({
			detail: false,
		}, options);

		const folder = typeof src === 'object'
			? src
			: hint?.folderMap?.get(src) ?? await this.driveFoldersRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: folder.id,
			createdAt: this.idService.parse(folder.id).date.toISOString(),
			name: folder.name,
			parentId: folder.parentId,

			...(opts.detail ? {
				foldersCount: hint?.foldersCountMap?.get(folder.id)
					?? this.driveFoldersRepository.countBy({
						parentId: folder.id,
					}),
				filesCount: hint?.filesCountMap?.get(folder.id)
					?? this.driveFilesRepository.countBy({
						folderId: folder.id,
					}),

				...(folder.parentId ? {
					parent: hint?.parentPacker
						? hint.parentPacker(folder.parentId)
						: this.pack(folder.parentId, { detail: true }, hint),
				} : {}),
			} : {}),
		});
	}

	public async packMany(
		src: Array<MiDriveFolder['id'] | MiDriveFolder>,
		options?: {
			detail: boolean
		},
	): Promise<Array<Packed<'DriveFolder'>>> {
		/**
		 * 重複を除去しつつ、必要なDriveFolderオブジェクトをすべて取得する
		 */
		const collectUniqueObjects = async (src: Array<MiDriveFolder['id'] | MiDriveFolder>) => {
			const uniqueSrc = uniqueByKey(
				src,
				(s) => typeof s === 'string' ? s : s.id,
			);
			const { ids, objects } = splitIdAndObjects(uniqueSrc);

			const uniqueObjects = new Map<string, MiDriveFolder>(objects.map(s => [s.id, s]));
			const needsFetchIds = ids.filter(id => !uniqueObjects.has(id));

			if (needsFetchIds.length > 0) {
				const fetchedObjects = await this.driveFoldersRepository.find({
					where: {
						id: In(needsFetchIds),
					},
				});
				for (const obj of fetchedObjects) {
					uniqueObjects.set(obj.id, obj);
				}
			}

			return uniqueObjects;
		};

		/**
		 * 親フォルダーを再帰的に収集する
		 */
		const collectAncestors = async (folderMap: Map<string, MiDriveFolder>) => {
			for (;;) {
				const parentIds = new Set<string>();
				for (const folder of folderMap.values()) {
					if (folder.parentId != null && !folderMap.has(folder.parentId)) {
						parentIds.add(folder.parentId);
					}
				}

				if (parentIds.size === 0) break;

				const fetchedParents = await this.driveFoldersRepository.find({
					where: {
						id: In([...parentIds]),
					},
				});

				if (fetchedParents.length === 0) break;

				for (const parent of fetchedParents) {
					folderMap.set(parent.id, parent);
				}
			}
		};

		const opts = Object.assign({
			detail: false,
		}, options);

		const folderMap = await collectUniqueObjects(src);

		let foldersCountMap: Map<string, number> | null = null;
		let filesCountMap: Map<string, number> | null = null;
		if (opts.detail) {
			await collectAncestors(folderMap);

			const ids = [...folderMap.keys()];
			if (ids.length > 0) {
				const folderCounts = await this.driveFoldersRepository.createQueryBuilder('folder')
					.select('folder.parentId', 'parentId')
					.addSelect('COUNT(*)', 'count')
					.where('folder.parentId IN (:...ids)', { ids })
					.groupBy('folder.parentId')
					.getRawMany<{ parentId: string; count: string }>();

				const fileCounts = await this.driveFilesRepository.createQueryBuilder('file')
					.select('file.folderId', 'folderId')
					.addSelect('COUNT(*)', 'count')
					.where('file.folderId IN (:...ids)', { ids })
					.groupBy('file.folderId')
					.getRawMany<{ folderId: string; count: string }>();

				foldersCountMap = new Map(folderCounts.map(row => [row.parentId, Number(row.count)]));
				filesCountMap = new Map(fileCounts.map(row => [row.folderId, Number(row.count)]));
			} else {
				foldersCountMap = new Map();
				filesCountMap = new Map();
			}
		}

		const packedMap = new Map<string, Promise<Packed<'DriveFolder'>>>();
		const packFromId = (id: string): Promise<Packed<'DriveFolder'>> => {
			const cached = packedMap.get(id);
			if (cached) return cached;

			const folder = folderMap.get(id);
			if (!folder) {
				throw new Error(`DriveFolder not found: ${id}`);
			}

			const packedPromise = this.pack(folder, options, {
				folderMap,
				foldersCountMap,
				filesCountMap,
				parentPacker: packFromId,
			});
			packedMap.set(id, packedPromise);

			return packedPromise;
		};

		return Promise.all(src.map(s => packFromId(typeof s === 'string' ? s : s.id)));
	}
}
