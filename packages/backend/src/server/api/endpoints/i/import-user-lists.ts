/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueueService } from '@/core/QueueService.js';
import { AccountMoveService } from '@/core/AccountMoveService.js';
import type { DriveFilesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';

export const meta = {
	secure: true,
	requireCredential: true,
	requireRolePolicy: 'canImportUserLists',
	prohibitMoved: true,
	limit: {
		duration: ms('1hour'),
		max: 1,
	},

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'ea9cc34f-c415-4bc6-a6fe-28ac40357049',
		},

		unexpectedFileType: {
			message: 'We need csv file.',
			code: 'UNEXPECTED_FILE_TYPE',
			id: 'a3c9edda-dd9b-4596-be6a-150ef813745c',
		},

		tooBigFile: {
			message: 'That file is too big.',
			code: 'TOO_BIG_FILE',
			id: 'ae6e7a22-971b-4b52-b2be-fc0b9b121fe9',
		},

		emptyFile: {
			message: 'That file is empty.',
			code: 'EMPTY_FILE',
			id: '99efe367-ce6e-4d44-93f8-5fae7b040356',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		fileId: { type: 'string', format: 'misskey:id' },
	},
	required: ['fileId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private queueService: QueueService,
		private accountMoveService: AccountMoveService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const file = await this.driveFilesRepository.findOneBy({ id: ps.fileId });

			if (file == null) throw new ApiError(meta.errors.noSuchFile);
			//if (!file.type.endsWith('/csv')) throw new ApiError(meta.errors.unexpectedFileType);
			if (file.size === 0) throw new ApiError(meta.errors.emptyFile);

			const checkMoving = await this.accountMoveService.validateAlsoKnownAs(
				me,
				(old, src) => !!src.movedAt && src.movedAt.getTime() + 1000 * 60 * 60 * 2 > Date.now(),
				true,
			);
			if (checkMoving ? file.size > 32 * 1024 * 1024 : file.size > 64 * 1024) throw new ApiError(meta.errors.tooBigFile);

			this.queueService.createImportUserListsJob(me, file.id);
		});
	}
}
