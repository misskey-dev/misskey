/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { DriveFilesRepository, MiWorldRoom, WorldRoomsRepository } from '@/models/_.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/json-schema.js';
import type { } from '@/models/Blocking.js';
import type { MiUser } from '@/models/User.js';
import type { MiDriveFile } from '@/models/DriveFile.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { WorldRoomService } from '@/core/WorldRoomService.js';
import { UserEntityService } from './UserEntityService.js';
import { DriveFileEntityService } from './DriveFileEntityService.js';
import { In } from 'typeorm';

@Injectable()
export class WorldRoomEntityService {
	constructor(
		@Inject(DI.worldRoomsRepository)
		private worldRoomsRepository: WorldRoomsRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private worldRoomService: WorldRoomService,
		private userEntityService: UserEntityService,
		private driveFileEntityService: DriveFileEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async packLite(
		src: MiWorldRoom['id'] | MiWorldRoom,
		me?: { id: MiUser['id'] } | null | undefined,
		hint?: {
			packedUser?: Packed<'UserLite'>
		},
	): Promise<Packed<'WorldRoomLite'>> {
		const meId = me ? me.id : null;
		const room = typeof src === 'object' ? src : await this.worldRoomsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: room.id,
			createdAt: this.idService.parse(room.id).date.toISOString(),
			updatedAt: room.updatedAt.toISOString(),
			userId: room.userId,
			user: hint?.packedUser ?? this.userEntityService.pack(room.user ?? room.userId, me),
			name: room.name,
			description: room.description,
		});
	}

	@bindThis
	public async packDetailed(
		src: MiWorldRoom['id'] | MiWorldRoom,
		me?: { id: MiUser['id'] } | null | undefined,
		hint?: {
			packedUser?: Packed<'UserLite'>
		},
	): Promise<Packed<'WorldRoomDetailed'>> {
		const meId = me ? me.id : null;
		const room = typeof src === 'object' ? src : await this.worldRoomsRepository.findOneByOrFail({ id: src });

		const attachedFileIds = this.worldRoomService.collectReferencedDriveFileIds(room.def);
		const attachedFiles = attachedFileIds.size === 0 ? [] : await this.driveFilesRepository.findBy({ id: In([...attachedFileIds]), userId: room.userId });

		return await awaitAll({
			id: room.id,
			createdAt: this.idService.parse(room.id).date.toISOString(),
			updatedAt: room.updatedAt.toISOString(),
			userId: room.userId,
			user: hint?.packedUser ?? this.userEntityService.pack(room.user ?? room.userId, me),
			name: room.name,
			description: room.description,
			def: room.def,
			attachedFiles: this.driveFileEntityService.packMany(attachedFiles),
		});
	}

	@bindThis
	public async packLiteMany(
		rooms: MiWorldRoom[],
		me?: { id: MiUser['id'] } | null | undefined,
	) {
		const _users = rooms.map(({ user, userId }) => user ?? userId);
		const _userMap = await this.userEntityService.packMany(_users, me)
			.then(users => new Map(users.map(u => [u.id, u])));
		return Promise.all(rooms.map(room => this.packLite(room, me, { packedUser: _userMap.get(room.userId) })));
	}
}

