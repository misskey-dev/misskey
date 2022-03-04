import { EntityRepository, Repository } from 'typeorm';
import { DriveFolders, DriveFiles } from '../index.js';
import { DriveFolder } from '@/models/entities/drive-folder.js';
import { awaitAll } from '@/prelude/await-all.js';
import { Packed } from '@/misc/schema.js';

@EntityRepository(DriveFolder)
export class DriveFolderRepository extends Repository<DriveFolder> {
	public async pack(
		src: DriveFolder['id'] | DriveFolder,
		options?: {
			detail: boolean
		}
	): Promise<Packed<'DriveFolder'>> {
		const opts = Object.assign({
			detail: false,
		}, options);

		const folder = typeof src === 'object' ? src : await this.findOneOrFail(src);

		return await awaitAll({
			id: folder.id,
			createdAt: folder.createdAt.toISOString(),
			name: folder.name,
			parentId: folder.parentId,

			...(opts.detail ? {
				foldersCount: DriveFolders.count({
					parentId: folder.id,
				}),
				filesCount: DriveFiles.count({
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
