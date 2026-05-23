/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DataSource, In, Not } from 'typeorm';
import { DI } from '@/di-symbols.js';
import {
	MiDriveFile,
	MiWorldRoom,
} from '@/models/_.js';
import type { WorldRoomsRepository } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { RoleService } from '@/core/RoleService.js';
import { IdService } from '@/core/IdService.js';
import type { MiUser } from '@/models/User.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { QueryService } from '@/core/QueryService.js';

const driveFileReferencingOptions = {
	clippedPicture: ['image'],
	tapestry: ['image'],
	poster: ['image'],
	pictureFrame: ['image'],
	tabletopPictureFrame: ['image'],
	tabletopGlassPictureFrame: ['image'],
	wallCanvas: ['image'],
	wallGlassPictureFrame: ['image'],
	tabletopFlag: ['image'],
	tabletopLcdButtonsController: ['image'],
	djPlayer: ['image'],
	monitor: ['image'],
	allInOnePc: ['image'],
	laptopPc: ['image'],
	handheldGameConsole: ['image'],
	largeMousepad: ['image'],
} as Record<string, string[]>;

@Injectable()
export class WorldRoomService {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.worldRoomsRepository)
		private worldRoomsRepository: WorldRoomsRepository,

		private roleService: RoleService,
		private moderationLogService: ModerationLogService,
		private queryService: QueryService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async findMyRoomById(userId: MiUser['id'], roomId: MiWorldRoom['id']) {
		return this.worldRoomsRepository.findOneBy({ id: roomId, userId: userId });
	}

	@bindThis
	public async findRoomById(roomId: MiWorldRoom['id']) {
		return this.worldRoomsRepository.findOne({ where: { id: roomId }, relations: ['user'] });
	}

	@bindThis
	public async getRoomsOfUserWithPagination(userId: MiUser['id'], self: boolean, limit: number, sinceId?: MiWorldRoom['id'] | null, untilId?: MiWorldRoom['id'] | null) {
		const query = this.queryService.makePaginationQuery(this.worldRoomsRepository.createQueryBuilder('room'), sinceId, untilId)
			.andWhere('room.userId = :userId', { userId });

		if (!self) {
			query.andWhere('room.visibility = :visibility', { visibility: 'public' });
		}

		const rooms = await query.take(limit).getMany();

		return rooms;
	}

	@bindThis
	public async create(
		me: MiUser,
		body: Partial<MiWorldRoom>,
	): Promise<MiWorldRoom> {
		const room = await this.worldRoomsRepository.insertOne(new MiWorldRoom({
			id: this.idService.gen(),
			updatedAt: new Date(),
			name: body.name,
			description: body.description,
			def: body.def,
			userId: me.id,
			visibility: body.visibility,
		}));

		return room;
	}

	@bindThis
	public async update(
		room: MiWorldRoom,
		body: Partial<MiWorldRoom>,
	): Promise<void> {
		body.updatedAt = new Date();
		return this.worldRoomsRepository.createQueryBuilder().update()
			.set(body)
			.where('id = :id', { id: room.id })
			.returning('*')
			.execute()
			.then((response) => {
				return response.raw[0];
			});
	}

	@bindThis
	public async delete(room: MiWorldRoom, deleter?: MiUser): Promise<void> {
		await this.worldRoomsRepository.delete(room.id);
	}

	collectReferencedDriveFileIds(roomState: MiWorldRoom['def']): Set<MiDriveFile['id']> {
		const fileIds = new Set<MiDriveFile['id']>();
		for (const o of roomState.installedObjects) {
			const def = driveFileReferencingOptions[o.type];
			if (def == null) continue;
			for (const key of def) {
				const optionValue = o.options[key];
				if (optionValue != null && optionValue.driveFileId != null && optionValue.driveFileId !== '') {
					fileIds.add(optionValue.driveFileId);
				}
			}
		}
		return fileIds;
	}
}
