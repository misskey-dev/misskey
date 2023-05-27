import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RolesRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { RoleEntityService } from '@/core/entities/RoleEntityService.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/roles/list'> {
	name = 'admin/roles/list' as const;
	constructor(
		@Inject(DI.rolesRepository)
		private rolesRepository: RolesRepository,

		private roleEntityService: RoleEntityService,
	) {
		super(async (ps, me) => {
			const roles = await this.rolesRepository.find({
				order: { lastUsedAt: 'DESC' },
			});
			return await this.roleEntityService.packMany(roles, me);
		});
	}
}
