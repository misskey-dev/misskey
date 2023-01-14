import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { RoleAssignmentsRepository, RolesRepository } from '@/models/index.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/schema.js';
import type { User } from '@/models/entities/User.js';
import type { Role } from '@/models/entities/Role.js';
import { bindThis } from '@/decorators.js';
import { DEFAULT_ROLE } from '@/core/RoleService.js';
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
		options?: {
			detail?: boolean;
		},
	) {
		const opts = Object.assign({
			detail: true,
		}, options);

		const role = typeof src === 'object' ? src : await this.rolesRepository.findOneByOrFail({ id: src });

		const assigns = await this.roleAssignmentsRepository.findBy({
			roleId: role.id,
		});

		const roleOptions = { ...role.options };
		for (const [k, v] of Object.entries(DEFAULT_ROLE)) {
			if (roleOptions[k] == null) roleOptions[k] = {
				useDefault: true,
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
			target: role.target,
			condFormula: role.condFormula,
			isPublic: role.isPublic,
			isAdministrator: role.isAdministrator,
			isModerator: role.isModerator,
			canEditMembersByModerator: role.canEditMembersByModerator,
			options: roleOptions,
			usersCount: assigns.length,
			...(opts.detail ? {
				users: this.userEntityService.packMany(assigns.map(x => x.userId), me),
			} : {}),
		});
	}

	@bindThis
	public packMany(
		roles: any[],
		me: { id: User['id'] },
		options?: {
			detail?: boolean;
		},
	) {
		return Promise.all(roles.map(x => this.pack(x, me, options)));
	}
}

