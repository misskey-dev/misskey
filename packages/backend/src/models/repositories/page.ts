import { db } from '@/db/postgre.js';
import { Page } from '@/models/entities/page.js';
import { Packed } from '@/misc/schema.js';
import { awaitAll } from '@/prelude/await-all.js';
import { DriveFile } from '@/models/entities/drive-file.js';
import { User } from '@/models/entities/user.js';
import { Users, DriveFiles, PageLikes } from '../index.js';

export const PageRepository = db.getRepository(Page).extend({
	async pack(
		src: Page['id'] | Page,
		me?: { id: User['id'] } | null | undefined,
	): Promise<Packed<'Page'>> {
		const meId = me ? me.id : null;
		const page = typeof src === 'object' ? src : await this.findOneByOrFail({ id: src });

		const attachedFiles: Promise<DriveFile | null>[] = [];
		const collectFile = (xs: any[]) => {
			for (const x of xs) {
				if (x.type === 'image') {
					attachedFiles.push(DriveFiles.findOneBy({
						id: x.fileId,
						userId: page.userId,
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
				content: page.content,
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
			attachedFiles: DriveFiles.packMany((await Promise.all(attachedFiles)).filter((x): x is DriveFile => x != null)),
			likedCount: page.likedCount,
			isLiked: meId ? await PageLikes.findOneBy({ pageId: page.id, userId: meId }).then(x => x != null) : undefined,
		});
	},

	packMany(
		pages: Page[],
		me?: { id: User['id'] } | null | undefined,
	) {
		return Promise.all(pages.map(x => this.pack(x, me)));
	},
});
