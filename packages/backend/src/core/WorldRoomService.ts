/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DataSource, In, Not } from 'typeorm';
import { DI } from '@/di-symbols.js';
import {
	MiPage,
	MiDriveFile,
	type UsersRepository,
	WorldRoomsRepository,
	MiWorldRoom,
} from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { RoleService } from '@/core/RoleService.js';
import { IdService } from '@/core/IdService.js';
import type { MiUser } from '@/models/User.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';

@Injectable()
export class WorldRoomService {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.worldRoomsRepository)
		private worldRoomsRepository: WorldRoomsRepository,

		private roleService: RoleService,
		private moderationLogService: ModerationLogService,
		private idService: IdService,
	) {
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
			visibility: 'public',
		}));

		return room;
	}

	@bindThis
	public async update(
		me: MiUser,
		roomId: MiWorldRoom['id'],
		body: Partial<MiWorldRoom>,
	): Promise<void> {
		return this.worldRoomsRepository.createQueryBuilder().update()
			.set(body)
			.where('id = :id', { id: roomId })
			.returning('*')
			.execute()
			.then((response) => {
				return response.raw[0];
			});
	}

	@bindThis
	public async delete(me: MiUser, roomId: MiWorldRoom['id']): Promise<void> {
		await this.worldRoomsRepository.delete(roomId);
	}

	// TODO: engineの実装と共通化
	collectReferencedDriveFileIds(roomState: MiWorldRoom['def']): Set<MiDriveFile['id']> {
		const fileIds = new Set<MiDriveFile['id']>();
		for (const o of roomState.installedObjects) {
			const def = getObjectDef(o.type); // 家具定義をバックエンドで利用するにはcreateInstance定義を分離し、それ以外を別パッケージとして抽出する必要がありそう しかしそれ以外の定義についてもi18nされたlabelなど、バックエンドには相応しくない情報も含まれているのでどうするか
			for (const schemaRecord of Object.entries(def.options.schema)) {
				if (schemaRecord[1].type === 'file') {
					const optionValue = o.options[schemaRecord[0]];
					if (optionValue != null && optionValue !== '') {
						fileIds.add(optionValue);
					}
				}
			}
		}
		return fileIds;
	}
}
