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
			id: 'b98644cf-a5ac-4277-a502-0b8054a709a3',
		},

		unexpectedFileType: {
			message: 'We need csv file.',
			code: 'UNEXPECTED_FILE_TYPE',
			id: '660f3599-bce0-4f95-9dde-311fd841c183',
		},

		tooBigFile: {
			message: 'That file is too big.',
			code: 'TOO_BIG_FILE',
			id: 'dee9d4ed-ad07-43ed-8b34-b2856398bc60',
		},

		emptyFile: {
			message: 'That file is empty.',
			code: 'EMPTY_FILE',
			id: '31a1b42c-06f7-42ae-8a38-a661c5c9f691',
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

			this.queueService.createImportFollowingJob(me, file.id);
		});
	}
}
