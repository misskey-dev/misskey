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
	//#region moderation
	editInstanceSettings: boolean;
	viewInstanceSettings: boolean;
	manageJobQueue: boolean;
	userSuspend: boolean;
	userSilence: boolean;
	createRole: boolean;
	readRole: boolean;
	updateRole: boolean;
	deleteRole: boolean;
	assignRole: boolean;
	invite: boolean;
	viewUserIps: boolean;
	createCustomEmoji: boolean;
	updateCustomEmoji: boolean;
	deleteCustomEmoji: boolean;
	viewAbuseUserReports: boolean;
	deleteAccount: boolean;
	manageAds: boolean;
	createAnnouncement: boolean;
	deleteAnnouncement: boolean;
	updateAnnouncement: boolean;
	deleteDriveFile: boolean;
	resetPassword: boolean;
	resolveAbuseUserReports: boolean;
	showUserDetails: boolean;
	//#endregion

	forceGtlAvailable: boolean;
	forceLtlAvailable: boolean;
	driveCapacityMb: number;
	antennaLimit: number;
};

export const DEFAULT_ROLE: RoleOptions = {
	userSuspend: false,
	userSilence: false,
	createRole: false,
	readRole: false,
	updateRole: false,
	deleteRole: false,
	assignRole: false,
	invite: false,
	createCustomEmoji: false,
	updateCustomEmoji: false,
	deleteCustomEmoji: false,
	viewAbuseUserReports: false,
	deleteAccount: false,
	manageAds: false,
	createAnnouncement: false,
	deleteAnnouncement: false,
	updateAnnouncement: false,
	refreshRemoteInstanceMetadata: false,
	resetPassword: false,
	resolveAbuseUserReports: false,
	showUserDetails: false,
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
	public async getUserRoleOptions(userId: User['id']): Promise<RoleOptions> {
		const roles = await this.getUserRoles(userId);
		const meta = await this.metaService.fetch();
		const baseRoleOptions = { ...DEFAULT_ROLE, ...meta.defaultRoleOverride };

		function getOptionValue(role: Role, option: keyof RoleOptions) {
			return role.options[option] && role.options[option].useDefault !== true ? role.options[option].value : baseRoleOptions[option];
		}

		return {
			userSuspend: roles.map(r => getOptionValue(r, 'userSuspend')).some(v => v === true),
			userSilence: roles.map(r => getOptionValue(r, 'userSilence')).some(v => v === true),
			createRole: roles.map(r => getOptionValue(r, 'createRole')).some(v => v === true),
			readRole: roles.map(r => getOptionValue(r, 'readRole')).some(v => v === true),
			updateRole: roles.map(r => getOptionValue(r, 'updateRole')).some(v => v === true),
			deleteRole: roles.map(r => getOptionValue(r, 'deleteRole')).some(v => v === true),
			assignRole: roles.map(r => getOptionValue(r, 'assignRole')).some(v => v === true),
			invite: roles.map(r => getOptionValue(r, 'invite')).some(v => v === true),
			createCustomEmoji: roles.map(r => getOptionValue(r, 'createCustomEmoji')).some(v => v === true),
			updateCustomEmoji: roles.map(r => getOptionValue(r, 'updateCustomEmoji')).some(v => v === true),
			deleteCustomEmoji: roles.map(r => getOptionValue(r, 'deleteCustomEmoji')).some(v => v === true),
			viewAbuseUserReports: roles.map(r => getOptionValue(r, 'viewAbuseUserReports')).some(v => v === true),
			deleteAccount: roles.map(r => getOptionValue(r, 'deleteAccount')).some(v => v === true),
			manageAds: roles.map(r => getOptionValue(r, 'manageAds')).some(v => v === true),
			createAnnouncement: roles.map(r => getOptionValue(r, 'createAnnouncement')).some(v => v === true),
			deleteAnnouncement: roles.map(r => getOptionValue(r, 'deleteAnnouncement')).some(v => v === true),
			updateAnnouncement: roles.map(r => getOptionValue(r, 'updateAnnouncement')).some(v => v === true),
			resetPassword: roles.map(r => getOptionValue(r, 'resetPassword')).some(v => v === true),
			resolveAbuseUserReports: roles.map(r => getOptionValue(r, 'resolveAbuseUserReports')).some(v => v === true),
			showUserDetails: roles.map(r => getOptionValue(r, 'showUserDetails')).some(v => v === true),
			antennaLimit: Math.max(...roles.map(r => getOptionValue(r, 'antennaLimit'))),
		};
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined) {
		this.redisSubscriber.off('message', this.onMessage);
	}
}
