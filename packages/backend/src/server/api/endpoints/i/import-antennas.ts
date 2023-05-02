import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueueService } from '@/core/QueueService.js';
import type { AntennasRepository, DriveFilesRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';
import { RoleService } from '@/core/RoleService.js';

export const meta = {
	secure: true,
	requireCredential: true,
	prohibitMoved: true,

	limit: {
		duration: ms('1hour'),
		max: 1,
	},
	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: '3b71d086-c3fa-431c-b01d-ded65a777172',
		},
		emptyFile: {
			message: 'That file is empty.',
			code: 'EMPTY_FILE',
			id: '7f60115d-8d93-4b0f-bd0e-3815dcbb389f',
		},
		tooManyAntennas: {
			message: 'You cannot create antenna any more.',
			code: 'TOO_MANY_ANTENNAS',
			id: '600917d4-a4cb-4cc5-8ba8-7ac8ea3c7779',
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

@Injectable() // eslint-disable-next-line import/no-default-export
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor (
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,
		@Inject(DI.antennasRepository)
		private antennasRepository: AntennasRepository,
		private roleService: RoleService,
		private queueService: QueueService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const file = await this.driveFilesRepository.findOneBy({ id: ps.fileId });
			const currentAntennasCount = await this.antennasRepository.countBy({ userId: me.id });
			if (currentAntennasCount > (await this.roleService.getUserPolicies(me.id)).antennaLimit) {
				throw new ApiError(meta.errors.tooManyAntennas);
			}
			if (file === null) throw new ApiError(meta.errors.noSuchFile);
			if (file.size === 0) throw new ApiError(meta.errors.emptyFile);
			this.queueService.createImportAntennasJob(me, file.id);
		});
	}
} 
