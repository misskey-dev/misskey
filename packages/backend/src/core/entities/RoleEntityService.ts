import { Inject, Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { RoleAssignmentsRepository, RolesRepository } from '@/models/index.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { User } from '@/models/entities/User.js';
import type { Role } from '@/models/entities/Role.js';
import { bindThis } from '@/decorators.js';
import { DEFAULT_POLICIES } from '@/core/RoleService.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class RoleEntityService {
	constructor(
		@Inject(DI.rolesRepository)
		private rolesRepository: RolesRepository,

		@Inject(DI.roleAssignmentsRepository)
		private roleAssignmentsRepository: RoleAssignmentsRepository,

		private userEntityService: UserEntityService,
	) {
	}

	@bindThis
	public async pack(
		src: Role['id'] | Role,
		me?: { id: User['id'] } | null | undefined,
	) {
		const role = typeof src === 'object' ? src : await this.rolesRepository.findOneByOrFail({ id: src });

		const assignedCount = await this.roleAssignmentsRepository.createQueryBuilder('assign')
			.where('assign.roleId = :roleId', { roleId: role.id })
			.andWhere(new Brackets(qb => { qb
				.where('assign.expiresAt IS NULL')
				.orWhere('assign.expiresAt > :now', { now: new Date() });
			}))
			.getCount();

		const policies = { ...role.policies };
		for (const [k, v] of Object.entries(DEFAULT_POLICIES)) {
			if (policies[k] == null) policies[k] = {
				useDefault: true,
				priority: 0,
				value: v,
			};
		}

		return await awaitAll({
			id: role.id,
			createdAt: role.createdAt.toISOString(),
			updatedAt: role.updatedAt.toISOString(),
			name: role.name,
			description: role.description,
			color: role.color,
			iconUrl: role.iconUrl,
			target: role.target,
			condFormula: role.condFormula,
			isPublic: role.isPublic,
			isAdministrator: role.isAdministrator,
			isModerator: role.isModerator,
			asBadge: role.asBadge,
			canEditMembersByModerator: role.canEditMembersByModerator,
			policies: policies,
			usersCount: assignedCount,
		});
	}

	@bindThis
	public packMany(
		roles: any[],
		me: { id: User['id'] },
	) {
		return Promise.all(roles.map(x => this.pack(x, me)));
	}
}

