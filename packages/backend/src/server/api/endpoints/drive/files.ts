import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DriveFilesRepository } from '@/models/index.js';
import { QueryService } from '@/core/QueryService.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'read:drive',

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
		folderId: { type: 'string', format: 'misskey:id', nullable: true, default: null },
		type: { type: 'string', nullable: true, pattern: /^[a-zA-Z\/\-*]+$/.toString().slice(1, -1) },
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
			const query = this.queryService.makePaginationQuery(this.driveFilesRepository.createQueryBuilder('file'), ps.sinceId, ps.untilId)
				.andWhere('file.userId = :userId', { userId: me.id });

			if (ps.folderId) {
				query.andWhere('file.folderId = :folderId', { folderId: ps.folderId });
			} else {
				query.andWhere('file.folderId IS NULL');
			}

			if (ps.type) {
				if (ps.type.endsWith('/*')) {
					query.andWhere('file.type like :type', { type: ps.type.replace('/*', '/') + '%' });
				} else {
					query.andWhere('file.type = :type', { type: ps.type });
				}
			}

			const files = await query.take(ps.limit).getMany();

			return await this.driveFileEntityService.packMany(files, { detail: false, self: true });
		});
	}
}
