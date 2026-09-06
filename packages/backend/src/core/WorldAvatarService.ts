/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DataSource, In, Not } from 'typeorm';
import { DI } from '@/di-symbols.js';
import {
	MiDriveFile,
	MiWorldAvatar,
} from '@/models/_.js';
import type { DriveFilesRepository, WorldAvatarsRepository } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { RoleService } from '@/core/RoleService.js';
import { IdService } from '@/core/IdService.js';
import type { MiUser } from '@/models/User.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { QueryService } from '@/core/QueryService.js';

@Injectable()
export class WorldAvatarService {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.worldAvatarsRepository)
		private worldAvatarsRepository: WorldAvatarsRepository,

		private roleService: RoleService,
		private moderationLogService: ModerationLogService,
		private queryService: QueryService,
		private idService: IdService,
	) {
	}

	public defaultAvatar = {
		type: 'default',
		body: {
			color: [0.8, 0.8, 0.8],
			roughness: 1,
			metallic: 0,
		},
		eyes: {
			type: 'a',
			color: [0, 0, 0],
		},
		mouth: {
			type: 'a',
			color: [0, 0, 0],
		},
		accessories: [],
	} satisfies MiWorldAvatar['def'];

	@bindThis
	public async validateDef(
		me: MiUser,
		def: MiWorldAvatar['def'],
	): Promise<boolean> {
		// TODO

		return true;
	}

	@bindThis
	public async findMyAvatarById(userId: MiUser['id'], avatarId: MiWorldAvatar['id']) {
		return this.worldAvatarsRepository.findOneBy({ id: avatarId, userId: userId });
	}

	@bindThis
	public async findAvatarById(avatarId: MiWorldAvatar['id']) {
		return this.worldAvatarsRepository.findOne({ where: { id: avatarId }, relations: { user: true } });
	}

	@bindThis
	public async getMyAvatarsWithPagination(userId: MiUser['id'], limit: number, sinceId?: MiWorldAvatar['id'] | null, untilId?: MiWorldAvatar['id'] | null) {
		const query = this.queryService.makePaginationQuery(this.worldAvatarsRepository.createQueryBuilder('avatar'), sinceId, untilId)
			.andWhere('avatar.userId = :userId', { userId });

		const avatars = await query.take(limit).getMany();

		return avatars;
	}

	@bindThis
	public async create(
		me: MiUser,
		body: Partial<MiWorldAvatar>,
	): Promise<MiWorldAvatar> {
		const currentAvatarsCount = await this.worldAvatarsRepository.countBy({ userId: me.id });

		// TODO: limit by role policy

		const avatar = await this.worldAvatarsRepository.insertOne(new MiWorldAvatar({
			id: this.idService.gen(),
			updatedAt: new Date(),
			name: body.name,
			def: body.def,
			userId: me.id,
			active: currentAvatarsCount === 0,
		}));

		return avatar;
	}

	@bindThis
	public async update(
		avatar: MiWorldAvatar,
		body: Partial<MiWorldAvatar>,
	): Promise<void> {
		body.updatedAt = new Date();
		const updated = await this.worldAvatarsRepository.createQueryBuilder().update()
			.set(body)
			.where('id = :id', { id: avatar.id })
			.returning('*')
			.execute()
			.then((response) => {
				return response.raw[0];
			});

		if (body.active) {
			await this.worldAvatarsRepository.createQueryBuilder().update()
				.set({ active: false })
				.where('userId = :userId', { userId: avatar.userId })
				.andWhere('id != :id', { id: avatar.id })
				.execute();
		}

		return updated;
	}

	@bindThis
	public async delete(avatar: MiWorldAvatar, deleter?: MiUser): Promise<void> {
		await this.worldAvatarsRepository.delete(avatar.id);
	}

	@bindThis
	public async getActiveAvatarOfUser(userId: MiUser['id']) {
		return this.worldAvatarsRepository.findOneBy({ userId, active: true });
	}

	@bindThis
	public async getActiveAvatarOfUsers(userIds: MiUser['id'][]): Promise<MiWorldAvatar[]> {
		if (userIds.length === 0) return [];
		return this.worldAvatarsRepository.findBy({ userId: In(userIds), active: true });
	}
}
