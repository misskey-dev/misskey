import { EntityRepository, Repository } from 'typeorm';
import { DriveFolders, DriveFiles } from '..';
import rap from '@prezzemolo/rap';
import { DriveFolder } from '../entities/drive-folder';

@EntityRepository(DriveFolder)
export class DriveFolderRepository extends Repository<DriveFolder> {
	private async cloneOrFetch(x: DriveFolder['id'] | DriveFolder): Promise<DriveFolder> {
		if (typeof x === 'object') {
			return JSON.parse(JSON.stringify(x));
		} else {
			return await this.findOne(x);
		}
	}

	public validateFolderName(name: string): boolean {
		return (
			(name.trim().length > 0) &&
			(name.length <= 200)
		);
	}

	public async pack(
		folder: any,
		options?: {
			detail: boolean
		}
	): Promise<Record<string, any>> {
		const opts = Object.assign({
			detail: false
		}, options);

		const _folder = await this.cloneOrFetch(folder);

		return await rap({
			name: _folder.name,

			...(opts.detail ? {
				foldersCount: DriveFolders.count({
					parentId: _folder.id
				}),
				filesCount: DriveFiles.count({
					folderId: _folder.id
				}),

				...(_folder.parentId ? {
					parent: this.pack(_folder.parentId, {
						detail: true
					})
				} : {})
			} : {})
		});
	}
}
