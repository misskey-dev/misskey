import { EntityRepository, Repository } from 'typeorm';
import { DriveFolders, DriveFiles } from '../index';
import { DriveFolder } from '@/models/entities/drive-folder';
import { awaitAll } from '@/prelude/await-all';
import { Packed } from '@/misc/schema';

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

export const packedDriveFolderSchema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		id: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'date-time',
		},
		name: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
		},
		foldersCount: {
			type: 'number' as const,
			optional: true as const, nullable: false as const,
		},
		filesCount: {
			type: 'number' as const,
			optional: true as const, nullable: false as const,
		},
		parentId: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		parent: {
			type: 'object' as const,
			optional: true as const, nullable: true as const,
			ref: 'DriveFolder' as const,
		},
	},
};
