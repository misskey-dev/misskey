/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { DriveFilesRepository, PagesRepository, PageLikesRepository } from '@/models/_.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/json-schema.js';
import type { } from '@/models/Blocking.js';
import type { MiUser } from '@/models/User.js';
import type { MiPage } from '@/models/Page.js';
import type { MiDriveFile } from '@/models/DriveFile.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { isNotNull } from '@/misc/is-not-null.js';
import { UserEntityService } from './UserEntityService.js';
import { DriveFileEntityService } from './DriveFileEntityService.js';

@Injectable()
export class PageEntityService {
	constructor(
		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		@Inject(DI.pageLikesRepository)
		private pageLikesRepository: PageLikesRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private userEntityService: UserEntityService,
		private driveFileEntityService: DriveFileEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async pack(
		src: MiPage['id'] | MiPage,
		me?: { id: MiUser['id'] } | null | undefined,
	): Promise<Packed<'Page'>> {
		const meId = me ? me.id : null;
		const page = typeof src === 'object' ? src : await this.pagesRepository.findOneByOrFail({ id: src });

		const attachedFiles: Promise<MiDriveFile | null>[] = [];
		const collectFile = (xs: any[]) => {
			for (const x of xs) {
				if (x.type === 'image') {
					attachedFiles.push(this.driveFilesRepository.findOneBy({
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
			this.pagesRepository.update(page.id, {
				content: page.content,
			});
		}

		return await awaitAll({
			id: page.id,
			createdAt: this.idService.parse(page.id).date.toISOString(),
			updatedAt: page.updatedAt.toISOString(),
			userId: page.userId,
			user: this.userEntityService.pack(page.user ?? page.userId, me), // { schema: 'UserDetailed' } すると無限ループするので注意
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
			eyeCatchingImage: page.eyeCatchingImageId ? await this.driveFileEntityService.pack(page.eyeCatchingImageId) : null,
			attachedFiles: this.driveFileEntityService.packMany((await Promise.all(attachedFiles)).filter(isNotNull)),
			likedCount: page.likedCount,
			isLiked: meId ? await this.pageLikesRepository.exists({ where: { pageId: page.id, userId: meId } }) : undefined,
		});
	}

	@bindThis
	public packMany(
		pages: MiPage[],
		me?: { id: MiUser['id'] } | null | undefined,
	) {
		return Promise.all(pages.map(x => this.pack(x, me)));
	}
}

