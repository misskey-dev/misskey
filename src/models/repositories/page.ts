import { EntityRepository, Repository } from 'typeorm';
import { Page } from '../entities/page';
import { SchemaType, types, bool } from '../../misc/schema';
import { Users, DriveFiles, PageLikes } from '..';
import { awaitAll } from '../../prelude/await-all';
import { DriveFile } from '../entities/drive-file';
import { User } from '../entities/user';
import { ensure } from '../../prelude/ensure';

export type PackedPage = SchemaType<typeof packedPageSchema>;

@EntityRepository(Page)
export class PageRepository extends Repository<Page> {
	public async pack(
		src: Page['id'] | Page,
		me?: User['id'] | User | null | undefined,
	): Promise<PackedPage> {
		const meId = me ? typeof me === 'string' ? me : me.id : null;
		const page = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		const attachedFiles: Promise<DriveFile | undefined>[] = [];
		const collectFile = (xs: any[]) => {
			for (const x of xs) {
				if (x.type === 'image') {
					attachedFiles.push(DriveFiles.findOne({
						id: x.fileId,
						userId: page.userId
					}));
				}
				if (x.children) {
					collectFile(x.children);
				}
			}
		};
		collectFile(page.content);

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
		migrate(page.content);
		if (migrated) {
			this.update(page.id, {
				content: page.content
			});
		}

		return await awaitAll({
			id: page.id,
			createdAt: page.createdAt.toISOString(),
			updatedAt: page.updatedAt.toISOString(),
			userId: page.userId,
			user: Users.pack(page.user || page.userId),
			content: page.content,
			variables: page.variables,
			title: page.title,
			name: page.name,
			summary: page.summary,
			alignCenter: page.alignCenter,
			font: page.font,
			eyeCatchingImageId: page.eyeCatchingImageId,
			eyeCatchingImage: page.eyeCatchingImageId ? await DriveFiles.pack(page.eyeCatchingImageId) : null,
			attachedFiles: DriveFiles.packMany(await Promise.all(attachedFiles)),
			likedCount: page.likedCount,
			isLiked: meId ? await PageLikes.findOne({ pageId: page.id, userId: meId }).then(x => x != null) : undefined,
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
