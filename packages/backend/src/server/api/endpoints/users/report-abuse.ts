/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { setImmediate } from 'node:timers/promises';
import sanitizeHtml from 'sanitize-html';
import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import type { AbuseUserReportsRepository, NotesRepository } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { MetaService } from '@/core/MetaService.js';
import { EmailService } from '@/core/EmailService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { DI } from '@/di-symbols.js';
import { GetterService } from '@/server/api/GetterService.js';
import { RoleService } from '@/core/RoleService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['users'],

	requireCredential: true,
	kind: 'write:report-abuse',

	description: 'File a report.',

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '1acefcb5-0959-43fd-9685-b48305736cb5',
		},

		cannotReportYourself: {
			message: 'Cannot report yourself.',
			code: 'CANNOT_REPORT_YOURSELF',
			id: '1e13149e-b1e8-43cf-902e-c01dbfcb202f',
		},

		cannotReportAdmin: {
			message: 'Cannot report the admin.',
			code: 'CANNOT_REPORT_THE_ADMIN',
			id: '35e166f5-05fb-4f87-a2d5-adb42676d48f',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		comment: { type: 'string', minLength: 1, maxLength: 2048 },
		noteIds: { type: 'array', items: { type: 'string', format: 'misskey:id', maxLength: 16 } },
	},
	required: ['userId', 'comment'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.abuseUserReportsRepository)
		private abuseUserReportsRepository: AbuseUserReportsRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private idService: IdService,
		private metaService: MetaService,
		private emailService: EmailService,
		private getterService: GetterService,
		private roleService: RoleService,
		private noteEntityService: NoteEntityService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Lookup user
			const user = await this.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
				throw err;
			});

			if (user.id === me.id) {
				throw new ApiError(meta.errors.cannotReportYourself);
			}

			if (await this.roleService.isAdministrator(user)) {
				throw new ApiError(meta.errors.cannotReportAdmin);
			}

			const notes = ps.noteIds ? await this.notesRepository.find({
				where: { id: In(ps.noteIds), userId: user.id },
			}) : [];

			const report = await this.abuseUserReportsRepository.insert({
				id: this.idService.gen(),
				targetUserId: user.id,
				targetUserHost: user.host,
				reporterId: me.id,
				reporterHost: null,
				comment: ps.comment,
				notes: (ps.noteIds && !((await this.metaService.fetch()).enableGDPRMode)) ? await this.noteEntityService.packMany(notes) : [],
				noteIds: (ps.noteIds && (await this.metaService.fetch()).enableGDPRMode) ? ps.noteIds : [],
			}).then(x => this.abuseUserReportsRepository.findOneByOrFail(x.identifiers[0]));

			// Publish event to moderators
			setImmediate(async () => {
				const moderators = await this.roleService.getModerators();

				for (const moderator of moderators) {
					this.globalEventService.publishAdminStream(moderator.id, 'newAbuseUserReport', {
						id: report.id,
						targetUserId: report.targetUserId,
						reporterId: report.reporterId,
						comment: report.comment,
						notes: report.notes,
						noteIds: report.noteIds ?? [],
					});
				}
				const meta = await this.metaService.fetch();
				if (meta.email) {
					this.emailService.sendEmail(meta.email, 'New abuse report',
						sanitizeHtml(ps.comment),
						sanitizeHtml(ps.comment));
				}
			});
		});
	}
}
