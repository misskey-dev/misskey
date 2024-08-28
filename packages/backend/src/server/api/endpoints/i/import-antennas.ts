/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueueService } from '@/core/QueueService.js';
import type { AntennasRepository, DriveFilesRepository, UsersRepository, MiAntenna as _Antenna } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import { DownloadService } from '@/core/DownloadService.js';
import { ApiError } from '../../error.js';

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
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'e842c379-8ac7-4cf7-b07a-4d4de7e4671c',
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

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private roleService: RoleService,
		private queueService: QueueService,
		private downloadService: DownloadService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const userExist = await this.usersRepository.exists({ where: { id: me.id } });
			if (!userExist) throw new ApiError(meta.errors.noSuchUser);
			const file = await this.driveFilesRepository.findOneBy({ id: ps.fileId });
			if (file === null) throw new ApiError(meta.errors.noSuchFile);
			if (file.size === 0) throw new ApiError(meta.errors.emptyFile);
			const antennas: (_Antenna & { userListAccts: string[] | null })[] = JSON.parse(await this.downloadService.downloadTextFile(file.url));
			const currentAntennasCount = await this.antennasRepository.countBy({ userId: me.id });
			if (currentAntennasCount + antennas.length >= (await this.roleService.getUserPolicies(me.id)).antennaLimit) {
				throw new ApiError(meta.errors.tooManyAntennas);
			}
			this.queueService.createImportAntennasJob(me, antennas);
		});
	}
}

export type Antenna = (_Antenna & { userListAccts: string[] | null })[];
