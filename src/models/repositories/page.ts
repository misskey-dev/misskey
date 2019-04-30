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

		// 後方互換性のため
		let migrated = false;
		const migrate = (xs: any[]) => {
			for (const x of xs) {
				if (x.type === 'input') {
					if (x.inputType === 'text') {
						x.type = 'textInput';
					}
					if (x.inputType === 'number') {
						x.type = 'numberInput';
						if (x.default) x.default = parseInt(x.default, 10);
					}
					migrated = true;
				}
				if (x.children) {
					migrate(x.children);
				}
			}
		};
		migrate(src.content);
		if (migrated) {
			this.update(src.id, {
				content: src.content
			});
		}

		return await awaitAll({
			id: src.id,
			createdAt: src.createdAt.toISOString(),
			updatedAt: src.updatedAt.toISOString(),
			userId: src.userId,
			user: Users.pack(src.user || src.userId),
			content: src.content,
			variables: src.variables,
			title: src.title,
			name: src.name,
			summary: src.summary,
			alignCenter: src.alignCenter,
			font: src.font,
			eyeCatchingImageId: src.eyeCatchingImageId,
			eyeCatchingImage: src.eyeCatchingImageId ? await DriveFiles.pack(src.eyeCatchingImageId) : null,
			attachedFiles: DriveFiles.packMany(await Promise.all(attachedFiles))
		});
	}

	public packMany(
		pages: Page[],
	) {
		return Promise.all(pages.map(x => this.pack(x)));
	}
}

export const packedPageSchema = {
	type: types.object,
	optional: bool.false, nullable: bool.false,
	properties: {
		id: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'date-time',
		},
		updatedAt: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'date-time',
		},
		title: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
		},
		name: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
		},
		summary: {
			type: types.string,
			optional: bool.false, nullable: bool.true,
		},
		content: {
			type: types.array,
			optional: bool.false, nullable: bool.false,
		},
		variables: {
			type: types.array,
			optional: bool.false, nullable: bool.false,
		},
		userId: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'id',
		},
		user: {
			type: types.object,
			ref: 'User',
			optional: bool.false, nullable: bool.false,
		},
	}
};
