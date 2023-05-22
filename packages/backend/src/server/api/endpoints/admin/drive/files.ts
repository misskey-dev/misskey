import { Inject, Injectable } from '@nestjs/common';
import type { DriveFilesRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { DI } from '@/di-symbols.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/drive/files'> {
	name = 'admin/drive/files' as const;
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveFileEntityService: DriveFileEntityService,
		private queryService: QueryService,
	) {
		super(async (ps, me) => {
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

			const files = await query.take(ps.limit).getMany();

			return await this.driveFileEntityService.packMany(files, { detail: true, withUser: true, self: true });
		});
	}
}
