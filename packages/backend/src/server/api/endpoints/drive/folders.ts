import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DriveFoldersRepository } from '@/models/index.js';
import { QueryService } from '@/core/QueryService.js';
import { DriveFolderEntityService } from '@/core/entities/DriveFolderEntityService.js';
import { DI } from '@/di-symbols.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'drive/folders'> {
	name = 'drive/folders' as const;
	constructor(
		@Inject(DI.driveFoldersRepository)
		private driveFoldersRepository: DriveFoldersRepository,

		private driveFolderEntityService: DriveFolderEntityService,
		private queryService: QueryService,
	) {
		super(async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.driveFoldersRepository.createQueryBuilder('folder'), ps.sinceId, ps.untilId)
				.andWhere('folder.userId = :userId', { userId: me.id });

			if (ps.folderId) {
				query.andWhere('folder.parentId = :parentId', { parentId: ps.folderId });
			} else {
				query.andWhere('folder.parentId IS NULL');
			}

			const folders = await query.take(ps.limit).getMany();

			return await Promise.all(folders.map(folder => this.driveFolderEntityService.pack(folder)));
		});
	}
}
