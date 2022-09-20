import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueueService } from '@/core/QueueService.js';
import type { DriveFilesRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';

export const meta = {
	secure: true,
	requireCredential: true,

	limit: {
		duration: ms('1hour'),
		max: 1,
	},

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'ebb53e5f-6574-9c0c-0b92-7ca6def56d7e',
		},

		unexpectedFileType: {
			message: 'We need csv file.',
			code: 'UNEXPECTED_FILE_TYPE',
			id: 'b6fab7d6-d945-d67c-dfdb-32da1cd12cfe',
		},

		tooBigFile: {
			message: 'That file is too big.',
			code: 'TOO_BIG_FILE',
			id: 'b7fbf0b1-aeef-3b21-29ef-fadd4cb72ccf',
		},

		emptyFile: {
			message: 'That file is empty.',
			code: 'EMPTY_FILE',
			id: '6f3a4dcc-f060-a707-4950-806fbdbe60d6',
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

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private queueService: QueueService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const file = await this.driveFilesRepository.findOneBy({ id: ps.fileId });

			if (file == null) throw new ApiError(meta.errors.noSuchFile);
			//if (!file.type.endsWith('/csv')) throw new ApiError(meta.errors.unexpectedFileType);
			if (file.size > 50000) throw new ApiError(meta.errors.tooBigFile);
			if (file.size === 0) throw new ApiError(meta.errors.emptyFile);

			this.queueService.createImportBlockingJob(me, file.id);
		});
	}
}
