import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DriveFilesRepository } from '@/models/index.js';
import { QueryService } from '@/core/QueryService.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { DI } from '@/di-symbols.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'drive/files'> {
	name = 'drive/files' as const;
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveFileEntityService: DriveFileEntityService,
		private queryService: QueryService,
	) {
		super(async (ps, me) => {
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

			switch (ps.sort) {
				case '+createdAt': query.orderBy('file.createdAt', 'DESC'); break;
				case '-createdAt': query.orderBy('file.createdAt', 'ASC'); break;
				case '+name': query.orderBy('file.name', 'DESC'); break;
				case '-name': query.orderBy('file.name', 'ASC'); break;
				case '+size': query.orderBy('file.size', 'DESC'); break;
				case '-size': query.orderBy('file.size', 'ASC'); break;
			}

			const files = await query.take(ps.limit).getMany();

			return await this.driveFileEntityService.packMany(files, { detail: false, self: true });
		});
	}
}
