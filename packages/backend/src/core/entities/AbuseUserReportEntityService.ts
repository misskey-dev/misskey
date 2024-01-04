/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { AbuseUserReportsRepository, NotesRepository } from '@/models/_.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { MiAbuseUserReport } from '@/models/AbuseUserReport.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class AbuseUserReportEntityService {
	constructor(
		@Inject(DI.abuseUserReportsRepository)
		private abuseUserReportsRepository: AbuseUserReportsRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private userEntityService: UserEntityService,
		private noteEntityService: NoteEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async pack(
		src: MiAbuseUserReport['id'] | MiAbuseUserReport,
	) {
		const report = typeof src === 'object' ? src : await this.abuseUserReportsRepository.findOneByOrFail({ id: src });
		const notes = [];

		if (report.noteIds && report.noteIds.length > 0) {
			for (const x of report.noteIds) {
				const exists = await this.notesRepository.countBy({ id: x });
				if (exists === 0) {
					notes.push('deleted');
					continue;
				}
				notes.push(await this.noteEntityService.pack(x));
			}
		} else if (report.notes.length > 0) {
			notes.push(...(report.notes));
		}

		console.log(report.notes.length, null, notes);
		return await awaitAll({
			id: report.id,
			createdAt: this.idService.parse(report.id).date.toISOString(),
			comment: report.comment,
			notes,
			resolved: report.resolved,
			reporterId: report.reporterId,
			targetUserId: report.targetUserId,
			assigneeId: report.assigneeId,
			reporter: this.userEntityService.pack(report.reporter ?? report.reporterId, null, {
				detail: true,
			}),
			targetUser: this.userEntityService.pack(report.targetUser ?? report.targetUserId, null, {
				detail: true,
			}),
			assignee: report.assigneeId ? this.userEntityService.pack(report.assignee ?? report.assigneeId, null, {
				detail: true,
			}) : null,
			forwarded: report.forwarded,
		});
	}

	@bindThis
	public packMany(
		reports: any[],
	) {
		return Promise.all(reports.map(x => this.pack(x)));
	}
}
