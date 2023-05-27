import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RolesRepository } from '@/models/index.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/roles/delete'> {
	name = 'admin/roles/delete' as const;
	constructor(
		@Inject(DI.rolesRepository)
		private rolesRepository: RolesRepository,

		private globalEventService: GlobalEventService,
	) {
		super(async (ps) => {
			const role = await this.rolesRepository.findOneBy({ id: ps.roleId });
			if (role == null) {
				throw new ApiError(this.meta.errors.noSuchRole);
			}
			await this.rolesRepository.delete({
				id: ps.roleId,
			});
			this.globalEventService.publishInternalEvent('roleDeleted', role);
		});
	}
}
