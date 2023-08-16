/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { DriveFilesRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { DI } from '@/di-symbols.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'DriveFile',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		userId: { type: 'string', format: 'misskey:id', nullable: true },
		type: { type: 'string', nullable: true, pattern: /^[a-zA-Z0-9\/\-*]+$/.toString().slice(1, -1) },
		origin: { type: 'string', enum: ['combined', 'local', 'remote'], default: 'local' },
		hostname: {
			type: 'string',
			nullable: true,
			default: null,
			description: 'The local host is represented with `null`.',
		},
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveFileEntityService: DriveFileEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.driveFilesRepository.createQueryBuilder('file'), ps.sinceId, ps.untilId);

			if (ps.userId) {
				query.andWhere('file.userId = :userId', { userId: ps.userId });
			} else {
				if (ps.origin === 'local') {
					query.andWhere('file.userHost IS NULL');
				} else if (ps.origin === 'remote') {
					query.andWhere('file.userHost IS NOT NULL');
				}

				if (ps.hostname) {
					query.andWhere('file.userHost = :hostname', { hostname: ps.hostname });
				}
			}

			if (ps.type) {
				if (ps.type.endsWith('/*')) {
					query.andWhere('file.type like :type', { type: ps.type.replace('/*', '/') + '%' });
				} else {
					query.andWhere('file.type = :type', { type: ps.type });
				}
			}

			const files = await query.limit(ps.limit).getMany();

			return await this.driveFileEntityService.packMany(files, { detail: true, withUser: true, self: true });
		});
	}
}
