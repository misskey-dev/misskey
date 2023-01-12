import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import type { Role, RoleAssignment, RoleAssignmentsRepository, RolesRepository, UsersRepository } from '@/models/index.js';
import { Cache } from '@/misc/cache.js';
import type { CacheableLocalUser, CacheableUser, ILocalUser, User } from '@/models/entities/User.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { MetaService } from '@/core/MetaService.js';
import type { OnApplicationShutdown } from '@nestjs/common';

export type RoleOptions = {
	gtlAvailable: boolean;
	ltlAvailable: boolean;
	driveCapacityMb: number;
	antennaLimit: number;
};

export const DEFAULT_ROLE: RoleOptions = {
	gtlAvailable: true,
	ltlAvailable: true,
	driveCapacityMb: 100,
	antennaLimit: 5,
};

@Injectable()
export class RoleService implements OnApplicationShutdown {
	private rolesCache: Cache<Role[]>;
	private roleAssignmentByUserIdCache: Cache<RoleAssignment[]>;

	constructor(
		@Inject(DI.redisSubscriber)
		private redisSubscriber: Redis.Redis,

		@Inject(DI.rolesRepository)
		private rolesRepository: RolesRepository,

		@Inject(DI.roleAssignmentsRepository)
		private roleAssignmentsRepository: RoleAssignmentsRepository,

		private metaService: MetaService,
	) {
		//this.onMessage = this.onMessage.bind(this);

		this.rolesCache = new Cache<Role[]>(Infinity);
		this.roleAssignmentByUserIdCache = new Cache<RoleAssignment[]>(Infinity);

		this.redisSubscriber.on('message', this.onMessage);
	}

	@bindThis
	private async onMessage(_: string, data: string): Promise<void> {
		const obj = JSON.parse(data);

		if (obj.channel === 'internal') {
			const { type, body } = obj.message;
			switch (type) {
				// TODO
				default:
					break;
			}
		}
	}

	@bindThis
	public async getUserRoles(userId: User['id']) {
		const assigns = await this.roleAssignmentByUserIdCache.fetch(userId, () => this.roleAssignmentsRepository.findBy({ userId }));
		const assignedRoleIds = assigns.map(x => x.roleId);
		const roles = await this.rolesCache.fetch(null, () => this.rolesRepository.findBy({}));
		return roles.filter(r => assignedRoleIds.includes(r.id));
	}

	@bindThis
	public async getUserRoleOptions(userId: User['id'] | null): Promise<RoleOptions> {
		const meta = await this.metaService.fetch();
		const baseRoleOptions = { ...DEFAULT_ROLE, ...meta.defaultRoleOverride };

		if (userId == null) return baseRoleOptions;

		const roles = await this.getUserRoles(userId);

		function getOptionValue(role: Role, option: keyof RoleOptions) {
			return role.options[option] && role.options[option].useDefault !== true ? role.options[option].value : baseRoleOptions[option];
		}

		return {
			gtlAvailable: roles.some(r => getOptionValue(r, 'gtlAvailable')),
			ltlAvailable: roles.some(r => getOptionValue(r, 'ltlAvailable')),
			driveCapacityMb: Math.max(...roles.map(r => getOptionValue(r, 'driveCapacityMb'))),
			antennaLimit: Math.max(...roles.map(r => getOptionValue(r, 'antennaLimit'))),
		};
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined) {
		this.redisSubscriber.off('message', this.onMessage);
	}
}
