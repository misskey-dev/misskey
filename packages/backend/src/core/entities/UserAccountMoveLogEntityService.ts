import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { MiUserAccountMoveLog, UserAccountMoveLogRepository } from '@/models/_.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { MiUser } from '@/models/User.js';
import { bindThis } from '@/decorators.js';
import { Packed } from '@/misc/json-schema.js';
import { IdService } from '@/core/IdService.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class UserAccountMoveLogEntityService {
	constructor(
		@Inject(DI.userAccountMoveLogRepository)
		private userAccountMoveLogRepository: UserAccountMoveLogRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async pack(
		src: MiUserAccountMoveLog['id'] | MiUserAccountMoveLog,
		me: { id: MiUser['id'] } | null | undefined,
	) : Promise<Packed<'UserAccountMoveLog'>> {
		const log = typeof src === 'object' ? src : await this.userAccountMoveLogRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: log.id,
			createdAt: this.idService.parse(log.id).date.toISOString(),
			movedFromId: log.movedFromId,
			movedFrom: this.userEntityService.pack(log.movedFrom ?? log.movedFromId, me, {
				schema: 'UserDetailed',
			}),
			movedToId: log.movedToId,
			movedTo: this.userEntityService.pack(log.movedTo ?? log.movedToId, me, {
				schema: 'UserDetailed',
			}),
		});
	}

	@bindThis
	public async packMany(
		reports: (MiUserAccountMoveLog['id'] | MiUserAccountMoveLog)[],
		me: { id: MiUser['id'] } | null | undefined,
	) : Promise<Packed<'UserAccountMoveLog'>[]> {
		return (await Promise.allSettled(reports.map(x => this.pack(x, me))))
			.filter(result => result.status === 'fulfilled')
			.map(result => (result as PromiseFulfilledResult<Packed<'UserAccountMoveLog'>>).value);
	}
}

