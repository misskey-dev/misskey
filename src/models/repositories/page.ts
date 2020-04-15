import { EntityRepository, Repository } from 'typeorm';
import { Page } from '../entities/page';
import { SchemaType } from '../../misc/schema';
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
			user: Users.pack(page.user || page.userId, me), // { detail: true } すると無限ループするので注意
			content: page.content,
			variables: page.variables,
			title: page.title,
			name: page.name,
			summary: page.summary,
			hideTitleWhenPinned: page.hideTitleWhenPinned,
			alignCenter: page.alignCenter,
			font: page.font,
			script: page.script,
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
		updatedAt: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'date-time',
		},
		title: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
		},
		name: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
		},
		summary: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
		},
		content: {
			type: 'array' as const,
			optional: false as const, nullable: false as const,
		},
		variables: {
			type: 'array' as const,
			optional: false as const, nullable: false as const,
		},
		userId: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
		},
		user: {
			type: 'object' as const,
			ref: 'User',
			optional: false as const, nullable: false as const,
		},
	}
};
