import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RoleAssignmentsRepository, RolesRepository, UsersRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';

export const meta = {
	tags: ['admin', 'role'],

	requireCredential: true,
	rolePermission: 'assignRole',

	errors: {
		noSuchRole: {
			message: 'No such role.',
			code: 'NO_SUCH_ROLE',
			id: '6503c040-6af4-4ed9-bf07-f2dd16678eab',
		},

		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '558ea170-f653-4700-94d0-5a818371d0df',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		roleId: { type: 'string', format: 'misskey:id' },
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: [
		'roleId',
		'userId',
	],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.rolesRepository)
		private rolesRepository: RolesRepository,

		@Inject(DI.roleAssignmentsRepository)
		private roleAssignmentsRepository: RoleAssignmentsRepository,

		private globalEventService: GlobalEventService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps) => {
			const role = await this.rolesRepository.findOneBy({ id: ps.roleId });
			if (role == null) {
				throw new ApiError(meta.errors.noSuchRole);
			}

			const user = await this.usersRepository.findOneBy({ id: ps.userId });
			if (user == null) {
				throw new ApiError(meta.errors.noSuchUser);
			}

			const date = new Date();
			const created = await this.roleAssignmentsRepository.insert({
				id: this.idService.genId(),
				createdAt: date,
				roleId: role.id,
				userId: user.id,
			}).then(x => this.roleAssignmentsRepository.findOneByOrFail(x.identifiers[0]));
	
			this.globalEventService.publishInternalEvent('userRoleAssigned', created);
		});
	}
}
