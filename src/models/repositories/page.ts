import { EntityRepository, Repository } from 'typeorm';
import { Page } from '../entities/page';
import { SchemaType, types, bool } from '../../misc/schema';
import { Users, DriveFiles } from '..';
import { awaitAll } from '../../prelude/await-all';
import { DriveFile } from '../entities/drive-file';

export type PackedPage = SchemaType<typeof packedPageSchema>;

@EntityRepository(Page)
export class PageRepository extends Repository<Page> {
	public async pack(
		src: Page,
	): Promise<PackedPage> {
		const attachedFiles: Promise<DriveFile | undefined>[] = [];
		const collectFile = (xs: any[]) => {
			for (const x of xs) {
				if (x.type === 'image') {
					attachedFiles.push(DriveFiles.findOne({
						id: x.fileId,
						userId: src.userId
					}));
				}
				if (x.children) {
					collectFile(x.children);
				}
			}
		};
		collectFile(src.content);
		return await awaitAll({
			id: src.id,
			createdAt: src.createdAt.toISOString(),
			updatedAt: src.updatedAt.toISOString(),
			userId: src.userId,
			user: Users.pack(src.user || src.userId),
			content: src.content,
			variables: src.variables,
			title: src.title,
			attachedFiles: DriveFiles.packMany(await Promise.all(attachedFiles))
		});
	}
}

export const packedPageSchema = {
	type: types.object,
	optional: bool.false, nullable: bool.false,
	properties: {
	}
};
