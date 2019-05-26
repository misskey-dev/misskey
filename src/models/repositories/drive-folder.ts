import { EntityRepository, Repository } from 'typeorm';
import { DriveFolders, DriveFiles } from '..';
import { DriveFolder } from '../entities/drive-folder';
import { ensure } from '../../prelude/ensure';
import { awaitAll } from '../../prelude/await-all';
import { SchemaType, types, bool } from '../../misc/schema';

export type PackedDriveFolder = SchemaType<typeof packedDriveFolderSchema>;

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
	): Promise<PackedDriveFolder> {
		const opts = Object.assign({
			detail: false
		}, options);

		const folder = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		return await awaitAll({
			id: folder.id,
			createdAt: folder.createdAt.toISOString(),
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

export const packedDriveFolderSchema = {
	type: types.object,
	optional: bool.false, nullable: bool.false,
	properties: {
		id: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'id',
			description: 'The unique identifier for this Drive folder.',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'date-time',
			description: 'The date that the Drive folder was created.'
		},
		name: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			description: 'The folder name.',
		},
		foldersCount: {
			type: types.number,
			optional: bool.true, nullable: bool.false,
			description: 'The count of child folders.',
		},
		filesCount: {
			type: types.number,
			optional: bool.true, nullable: bool.false,
			description: 'The count of child files.',
		},
		parentId: {
			type: types.string,
			optional: bool.false, nullable: bool.true,
			format: 'id',
			description: 'The parent folder ID of this folder.',
			example: 'xxxxxxxxxx',
		},
		parent: {
			type: types.object,
			optional: bool.true, nullable: bool.true,
			ref: 'DriveFolder'
		},
	},
};
