/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DataSource, In, Not } from 'typeorm';
import { DI } from '@/di-symbols.js';
import {
	type NotesRepository,
	MiPage,
	type PagesRepository,
	MiDriveFile,
	type UsersRepository,
	MiNote,
} from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { RoleService } from '@/core/RoleService.js';
import { IdService } from '@/core/IdService.js';
import type { MiUser } from '@/models/User.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';

export interface PageBody {
	title: string;
	name: string;
	summary: string | null;
	content: Array<Record<string, any>>;
	variables: Array<Record<string, any>>;
	script: string;
	eyeCatchingImage?: MiDriveFile | null;
	font: 'serif' | 'sans-serif';
	alignCenter: boolean;
	hideTitleWhenPinned: boolean;
}

@Injectable()
export class PageService {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private roleService: RoleService,
		private moderationLogService: ModerationLogService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async create(
		me: MiUser,
		body: PageBody,
	): Promise<MiPage> {
		await this.pagesRepository.findBy({
			userId: me.id,
			name: body.name,
		}).then(result => {
			if (result.length > 0) {
				throw new IdentifiableError('1a79e38e-3d83-4423-845b-a9d83ff93b61');
			}
		});

		const page = await this.pagesRepository.insertOne(new MiPage({
			id: this.idService.gen(),
			updatedAt: new Date(),
			title: body.title,
			name: body.name,
			summary: body.summary,
			content: body.content,
			variables: body.variables,
			script: body.script,
			eyeCatchingImageId: body.eyeCatchingImage ? body.eyeCatchingImage.id : null,
			userId: me.id,
			visibility: 'public',
			alignCenter: body.alignCenter,
			hideTitleWhenPinned: body.hideTitleWhenPinned,
			font: body.font,
		}));

		const referencedNotes = this.collectReferencedNotes(page.content);
		if (referencedNotes.length > 0) {
			await this.notesRepository.increment({ id: In(referencedNotes) }, 'pageCount', 1);
		}

		return page;
	}

	@bindThis
	public async update(
		me: MiUser,
		pageId: MiPage['id'],
		body: Partial<PageBody>,
	): Promise<void> {
		await this.db.transaction(async (transaction) => {
			const page = await transaction.findOne(MiPage, {
				where: {
					id: pageId,
				},
				lock: { mode: 'for_no_key_update' },
			});

			if (page == null) {
				throw new IdentifiableError('66aefd3c-fdb2-4a71-85ae-cc18bea85d3f');
			}
			if (page.userId !== me.id) {
				throw new IdentifiableError('d0017699-8256-46f1-aed4-bc03bed73616');
			}

			if (body.name != null) {
				await transaction.findBy(MiPage, {
					id: Not(pageId),
					userId: me.id,
					name: body.name,
				}).then(result => {
					if (result.length > 0) {
						throw new IdentifiableError('d05bfe24-24b6-4ea2-a3ec-87cc9bf4daa4');
					}
				});
			}

			await transaction.update(MiPage, page.id, {
				updatedAt: new Date(),
				title: body.title,
				name: body.name,
				summary: body.summary === undefined ? page.summary : body.summary,
				content: body.content,
				variables: body.variables,
				script: body.script,
				alignCenter: body.alignCenter,
				hideTitleWhenPinned: body.hideTitleWhenPinned,
				font: body.font,
				eyeCatchingImageId: body.eyeCatchingImage === undefined ? undefined : (body.eyeCatchingImage?.id ?? null),
			});

			console.log('page.content', page.content);

			if (body.content != null) {
				const beforeReferencedNotes = this.collectReferencedNotes(page.content);
				const afterReferencedNotes = this.collectReferencedNotes(body.content);

				const removedNotes = beforeReferencedNotes.filter(noteId => !afterReferencedNotes.includes(noteId));
				const addedNotes = afterReferencedNotes.filter(noteId => !beforeReferencedNotes.includes(noteId));

				if (removedNotes.length > 0) {
					await transaction.decrement(MiNote, { id: In(removedNotes) }, 'pageCount', 1);
				}
				if (addedNotes.length > 0) {
					await transaction.increment(MiNote, { id: In(addedNotes) }, 'pageCount', 1);
				}
			}
		});
	}

	@bindThis
	public async delete(me: MiUser, pageId: MiPage['id']): Promise<void> {
		await this.db.transaction(async (transaction) => {
			const page = await transaction.findOne(MiPage, {
				where: {
					id: pageId,
				},
				lock: { mode: 'pessimistic_write' }, // same lock level as DELETE
			});

			if (page == null) {
				throw new IdentifiableError('66aefd3c-fdb2-4a71-85ae-cc18bea85d3f');
			}

			if (!await this.roleService.isModerator(me) && page.userId !== me.id) {
				throw new IdentifiableError('d0017699-8256-46f1-aed4-bc03bed73616');
			}

			await transaction.delete(MiPage, page.id);

			if (page.userId !== me.id) {
				const user = await this.usersRepository.findOneByOrFail({ id: page.userId });
				this.moderationLogService.log(me, 'deletePage', {
					pageId: page.id,
					pageUserId: page.userId,
					pageUserUsername: user.username,
					page,
				});
			}

			const referencedNotes = this.collectReferencedNotes(page.content);
			if (referencedNotes.length > 0) {
				await transaction.decrement(MiNote, { id: In(referencedNotes) }, 'pageCount', 1);
			}
		});
	}

	collectReferencedNotes(content: MiPage['content']): string[] {
		const referencingNotes = new Set<string>();
		const recursiveCollect = (content: unknown[]) => {
			for (const contentElement of content) {
				if (typeof contentElement === 'object'
					&& contentElement !== null
					&& 'type' in contentElement) {
					if (contentElement.type === 'note'
						&& 'note' in contentElement
						&& typeof contentElement.note === 'string') {
						referencingNotes.add(contentElement.note);
					}
					if (contentElement.type === 'section'
						&& 'children' in contentElement
						&& Array.isArray(contentElement.children)) {
						recursiveCollect(contentElement.children);
					}
				}
			}
		};
		recursiveCollect(content);
		return [...referencingNotes];
	}
}
