import { EntityRepository, Repository } from 'typeorm';
import { DriveFolders, DriveFiles } from '..';
import rap from '@prezzemolo/rap';
import { DriveFolder } from '../entities/drive-folder';
import { ensure } from '../../prelude/ensure';

@EntityRepository(DriveFolder)
export class DriveFolderRepository extends Repository<DriveFolder> {
	public validateFolderName(name: string): boolean {
		return (
			(name.trim().length > 0) &&
			(name.length <= 200)
		);
	}

	public async pack(
		src: DriveFolder['id'] | DriveFolder,
		options?: {
			detail: boolean
		}
	): Promise<Record<string, any>> {
		const opts = Object.assign({
			detail: false
		}, options);

		const folder = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		return await rap({
			id: folder.id,
			createdAt: folder.createdAt,
			name: folder.name,
			parentId: folder.parentId,

			...(opts.detail ? {
				foldersCount: DriveFolders.count({
					parentId: folder.id
				}),
				filesCount: DriveFiles.count({
					folderId: folder.id
				}),

				...(folder.parentId ? {
					parent: this.pack(folder.parentId, {
						detail: true
					})
				} : {})
			} : {})
		});
	}
}
