import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RolesRepository } from '@/models/index.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import { RoleEntityService } from '@/core/entities/RoleEntityService.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/roles/create'> {
	name = 'admin/roles/create' as const;
	constructor(
		@Inject(DI.rolesRepository)
		private rolesRepository: RolesRepository,

		private globalEventService: GlobalEventService,
		private idService: IdService,
		private roleEntityService: RoleEntityService,
	) {
		super(async (ps, me) => {
			const date = new Date();
			const created = await this.rolesRepository.insert({
				id: this.idService.genId(),
				createdAt: date,
				updatedAt: date,
				lastUsedAt: date,
				name: ps.name,
				description: ps.description,
				color: ps.color,
				iconUrl: ps.iconUrl,
				target: ps.target,
				condFormula: ps.condFormula,
				isPublic: ps.isPublic,
				isAdministrator: ps.isAdministrator,
				isModerator: ps.isModerator,
				isExplorable: ps.isExplorable,
				asBadge: ps.asBadge,
				canEditMembersByModerator: ps.canEditMembersByModerator,
				displayOrder: ps.displayOrder,
				policies: ps.policies,
			}).then(x => this.rolesRepository.findOneByOrFail(x.identifiers[0]));

			this.globalEventService.publishInternalEvent('roleCreated', created);

			return await this.roleEntityService.pack(created, me);
		});
	}
}
