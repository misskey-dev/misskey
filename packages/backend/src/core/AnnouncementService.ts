/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Brackets, EntityNotFoundError } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { MiUser } from '@/models/User.js';
import type { MiRole } from '@/models/Role.js';
import type { AnnouncementReadsRepository, AnnouncementsRepository, AnnouncementRolesRepository, MiAnnouncement, MiAnnouncementRead, UsersRepository } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { Packed } from '@/misc/json-schema.js';
import { IdService } from '@/core/IdService.js';
import { AnnouncementEntityService } from '@/core/entities/AnnouncementEntityService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { RoleService } from '@/core/RoleService.js';

@Injectable()
export class AnnouncementService {
	constructor(
		@Inject(DI.announcementsRepository)
		private announcementsRepository: AnnouncementsRepository,

		@Inject(DI.announcementRolesRepository)
		private announcementRolesRepository: AnnouncementRolesRepository,

		@Inject(DI.announcementReadsRepository)
		private announcementReadsRepository: AnnouncementReadsRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private idService: IdService,
		private globalEventService: GlobalEventService,
		private moderationLogService: ModerationLogService,
		private announcementEntityService: AnnouncementEntityService,
		private roleService: RoleService,
	) {
	}

	@bindThis
	public async getReads(userId: MiUser['id']): Promise<MiAnnouncementRead[]> {
		return this.announcementReadsRepository.findBy({
			userId: userId,
		});
	}

	@bindThis
	public async getUnreadAnnouncements(user: MiUser): Promise<MiAnnouncement[]> {
		const readsQuery = this.announcementReadsRepository.createQueryBuilder('read')
			.select('read.announcementId')
			.where('read.userId = :userId', { userId: user.id });

		const userRoles = await this.roleService.getUserRoles(user.id);

		const announcementRolesQuery = this.announcementRolesRepository.createQueryBuilder('ar')
			.select('ar.announcementId')
			.where('ar.roleId IN (:...roles)', { roles: userRoles.map(x => x.id) });

		const q = this.announcementsRepository.createQueryBuilder('announcement')
			.where('announcement.isActive = true')
			.andWhere('announcement.silence = false')
			.andWhere(new Brackets(qb => {
				qb.orWhere(new Brackets(qb2 => {
					qb2.orWhere('announcement.userId = :userId', { userId: user.id });
					qb2.orWhere('announcement.userId IS NULL');
				}));
				qb.andWhere(new Brackets(qb2 => {
					if (userRoles.length > 0) {
						qb2.orWhere(new Brackets(qb3 => {
							qb3.andWhere('announcement.isRoleSpecified = true');
							qb3.andWhere(`announcement.id IN (${ announcementRolesQuery.getQuery() })`);
						}));
					}
					qb2.orWhere('announcement.isRoleSpecified = false');
				}));
			}))
			.andWhere(new Brackets(qb => {
				qb.orWhere('announcement.forExistingUsers = false');
				qb.orWhere('announcement.id > :userId', { userId: user.id });
			}))
			.andWhere(`announcement.id NOT IN (${ readsQuery.getQuery() })`)
			.setParameters({
				...announcementRolesQuery.getParameters(),
				...readsQuery.getParameters(),
				userId: user.id,
			});

		q.setParameters(readsQuery.getParameters());

		return q.getMany();
	}

	@bindThis
	public async create(values: Partial<MiAnnouncement & { roleIds: MiRole['id'][] }>, moderator?: MiUser): Promise<{ raw: MiAnnouncement; packed: Packed<'Announcement'> }> {
		const announcement = await this.announcementsRepository.insertOne({
			id: this.idService.gen(),
			updatedAt: null,
			title: values.title,
			text: values.text,
			imageUrl: values.imageUrl,
			icon: values.icon,
			display: values.display,
			forExistingUsers: values.forExistingUsers,
			silence: values.silence,
			needConfirmationToRead: values.needConfirmationToRead,
			userId: values.userId,
			isRoleSpecified: values.isRoleSpecified ?? false,
		});

		const packed = await this.announcementEntityService.pack(announcement);

		if (values.userId) {
			this.globalEventService.publishMainStream(values.userId, 'announcementCreated', {
				announcement: packed,
			});

			if (moderator) {
				const user = await this.usersRepository.findOneByOrFail({ id: values.userId });
				this.moderationLogService.log(moderator, 'createUserAnnouncement', {
					announcementId: announcement.id,
					announcement: announcement,
					userId: values.userId,
					userUsername: user.username,
					userHost: user.host,
				});
			}
		} else if (values.isRoleSpecified === true) {
			if (values.roleIds == null) return { raw: announcement, packed: packed };

			const roleIds = values.roleIds;

			this.announcementRolesRepository.insert(roleIds.map(roleId => ({
				id: this.idService.gen(),
				announcementId: announcement.id,
				roleId: roleId,
			})).flat());

			const users = new Set(...(await Promise.all(roleIds.map(async (roleId) => await this.roleService.getRoleUsers(roleId)).flat())));
			users.forEach(async (user) => {
				this.globalEventService.publishMainStream(user.id, 'announcementCreated', {
					announcement: packed,
				});
			});

			if (moderator) {
				const roles = (await this.roleService.getRoles()).filter(role => roleIds.includes(role.id));
				this.moderationLogService.log(moderator, 'createRolesAnnouncement', {
					announcementId: announcement.id,
					announcement: announcement,
					roleIds: roleIds,
					roles: roles,
				});
			}
		} else {
			this.globalEventService.publishBroadcastStream('announcementCreated', {
				announcement: packed,
			});

			if (moderator) {
				this.moderationLogService.log(moderator, 'createGlobalAnnouncement', {
					announcementId: announcement.id,
					announcement: announcement,
				});
			}
		}

		return {
			raw: announcement,
			packed: packed,
		};
	}

	@bindThis
	public async update(announcement: MiAnnouncement, values: Partial<MiAnnouncement & { roleIds: MiRole['id'][] }>, moderator?: MiUser): Promise<void> {
		await this.announcementsRepository.update(announcement.id, {
			updatedAt: new Date(),
			title: values.title,
			text: values.text,
			/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- 空の文字列の場合、nullを渡すようにするため */
			imageUrl: values.imageUrl || null,
			display: values.display,
			icon: values.icon,
			forExistingUsers: values.forExistingUsers,
			silence: values.silence,
			needConfirmationToRead: values.needConfirmationToRead,
			isActive: values.isActive,
			isRoleSpecified: values.isRoleSpecified,
		});

		const after = await this.announcementsRepository.findOneByOrFail({ id: announcement.id });

		if (values.isRoleSpecified === true) {
			const roleIds = values.roleIds ?? [];
			const currentRoles = await this.announcementRolesRepository.findBy({
				announcementId: announcement.id,
			});

			const removedRoles = currentRoles.filter(x => !roleIds.includes(x.roleId));
			const addedRoles = roleIds.filter(x => !currentRoles.map(x => x.roleId).includes(x));

			if (removedRoles.length > 0) {
				await this.announcementRolesRepository.delete(removedRoles.map(x => x.id));
			}
			if (addedRoles.length > 0) {
				await this.announcementRolesRepository.insert(addedRoles.map(roleId => ({
					id: this.idService.gen(),
					announcementId: announcement.id,
					roleId: roleId,
				})).flat());
			}

			if (moderator) {
				const roleIds = values.roleIds ?? [];
				const roles = (await this.roleService.getRoles()).filter(role => roleIds.includes(role.id));
				this.moderationLogService.log(moderator, 'updateRolesAnnouncement', {
					announcementId: announcement.id,
					before: announcement,
					after: after,
					roleIds: roleIds,
					roles: roles,
				});
			}

			return;
		}

		if (moderator) {
			if (announcement.userId) {
				const user = await this.usersRepository.findOneByOrFail({ id: announcement.userId });
				this.moderationLogService.log(moderator, 'updateUserAnnouncement', {
					announcementId: announcement.id,
					before: announcement,
					after: after,
					userId: announcement.userId,
					userUsername: user.username,
					userHost: user.host,
				});
			} else {
				this.moderationLogService.log(moderator, 'updateGlobalAnnouncement', {
					announcementId: announcement.id,
					before: announcement,
					after: after,
				});
			}
		}
	}

	@bindThis
	public async delete(announcement: MiAnnouncement, moderator?: MiUser): Promise<void> {
		const announcementRoles = await this.announcementRolesRepository.findBy({ announcementId: announcement.id });
		await this.announcementsRepository.delete(announcement.id);

		if (moderator) {
			if (announcement.userId) {
				const user = await this.usersRepository.findOneByOrFail({ id: announcement.userId });
				this.moderationLogService.log(moderator, 'deleteUserAnnouncement', {
					announcementId: announcement.id,
					announcement: announcement,
					userId: announcement.userId,
					userUsername: user.username,
					userHost: user.host,
				});
			} else if (announcementRoles.length > 0) {
				const roles = await this.roleService.getRoles();
				this.moderationLogService.log(moderator, 'deleteRolesAnnouncement', {
					announcementId: announcement.id,
					announcement: announcement,
					roleIds: announcementRoles.map(x => x.roleId),
					roles: roles.filter(x => announcementRoles.map(x => x.roleId).includes(x.id)),
				});
			} else {
				this.moderationLogService.log(moderator, 'deleteGlobalAnnouncement', {
					announcementId: announcement.id,
					announcement: announcement,
				});
			}
		}
	}

	@bindThis
	public async getAnnouncement(announcementId: MiAnnouncement['id'], me: MiUser | null): Promise<Packed<'Announcement'>> {
		const announcement = await this.announcementsRepository.findOneByOrFail({ id: announcementId });
		if (me) {
			if (announcement.userId && announcement.userId !== me.id) {
				throw new EntityNotFoundError(this.announcementsRepository.metadata.target, { id: announcementId });
			}

			const read = await this.announcementReadsRepository.findOneBy({
				announcementId: announcement.id,
				userId: me.id,
			});
			return this.announcementEntityService.pack({ ...announcement, isRead: read !== null }, me);
		} else {
			return this.announcementEntityService.pack(announcement, null);
		}
	}

	@bindThis
	public async read(user: MiUser, announcementId: MiAnnouncement['id']): Promise<void> {
		try {
			await this.announcementReadsRepository.insert({
				id: this.idService.gen(),
				announcementId: announcementId,
				userId: user.id,
			});
		} catch (e) {
			return;
		}

		const announcement = await this.announcementsRepository.findOneBy({ id: announcementId });
		if (announcement != null && announcement.userId === user.id) {
			await this.announcementsRepository.update(announcementId, {
				isActive: false,
			});
		}

		if ((await this.getUnreadAnnouncements(user)).length === 0) {
			this.globalEventService.publishMainStream(user.id, 'readAllAnnouncements');
		}
	}
}
