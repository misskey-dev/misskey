import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DriveFilesRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'drive/files/check-existence'> {
	name = 'drive/files/check-existence' as const;
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,
	) {
		super(async (ps, me) => {
			const file = await this.driveFilesRepository.findOneBy({
				md5: ps.md5,
				userId: me.id,
			});

			return file != null;
		});
	}
}
