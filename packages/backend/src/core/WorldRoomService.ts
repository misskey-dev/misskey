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
import type { DriveFilesRepository, WorldRoomsRepository } from '@/models/_.js';
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

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private roleService: RoleService,
		private moderationLogService: ModerationLogService,
		private queryService: QueryService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async validateDef(
		me: MiUser,
		def: MiWorldRoom['def'],
	): Promise<boolean> {
		// TODO: スキーマ検証(関係ないプロパティを入れたり不正な値を入れたりできないように)
		// そのためにはJSON SchemaでRoomState/各objectのoptionsを定義する必要がある

		const objectsLimit = 100; // TODO: ref role policy
		if (def.installedObjects.length > objectsLimit) {
			return false;
		}

		const attachedFilesLimit = 30; // TODO: ref role policy

		const attachedFileIds = this.collectReferencedDriveFileIds(def);
		if (attachedFileIds.size > attachedFilesLimit) {
			return false;
		}

		const attachedFiles = attachedFileIds.size === 0 ? [] : await this.driveFilesRepository.findBy({ id: In([...attachedFileIds]), userId: me.id });
		for (const file of attachedFiles) {
			if (!file.type.startsWith('image/')) {
				return false;
			}
			if (file.size > 5 * 1024 * 1024) {
				return false;
			}
			if (Math.max(file.properties.width ?? 0, file.properties.height ?? 0) > 2048) {
				return false;
			}
		}

		return true;
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

	@bindThis
	public collectReferencedDriveFileIds(roomState: MiWorldRoom['def']): Set<MiDriveFile['id']> {
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
