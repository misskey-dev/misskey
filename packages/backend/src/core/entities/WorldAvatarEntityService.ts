/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { DriveFilesRepository, MiWorldAvatar, WorldAvatarsRepository } from '@/models/_.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/json-schema.js';
import type { } from '@/models/Blocking.js';
import type { MiUser } from '@/models/User.js';
import type { MiDriveFile } from '@/models/DriveFile.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { WorldAvatarService } from '@/core/WorldAvatarService.js';
import { UserEntityService } from './UserEntityService.js';
import { DriveFileEntityService } from './DriveFileEntityService.js';
import { In } from 'typeorm';

@Injectable()
export class WorldAvatarEntityService {
	constructor(
		@Inject(DI.worldAvatarsRepository)
		private worldAvatarsRepository: WorldAvatarsRepository,

		private worldAvatarService: WorldAvatarService,
		private userEntityService: UserEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async packLite(
		src: MiWorldAvatar['id'] | MiWorldAvatar,
		me?: { id: MiUser['id'] } | null | undefined,
		hint?: {
			packedUser?: Packed<'UserLite'>
		},
	): Promise<Packed<'WorldAvatarLite'>> {
		const meId = me ? me.id : null;
		const avatar = typeof src === 'object' ? src : await this.worldAvatarsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: avatar.id,
			def: avatar.def,
		});
	}

	@bindThis
	public async packDetailed(
		src: MiWorldAvatar['id'] | MiWorldAvatar,
		me?: { id: MiUser['id'] } | null | undefined,
		hint?: {
			packedUser?: Packed<'UserLite'>
		},
	): Promise<Packed<'WorldAvatarDetailed'>> {
		const meId = me ? me.id : null;
		const avatar = typeof src === 'object' ? src : await this.worldAvatarsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: avatar.id,
			createdAt: this.idService.parse(avatar.id).date.toISOString(),
			updatedAt: avatar.updatedAt.toISOString(),
			name: avatar.name,
			def: avatar.def,
			active: avatar.active,
		});
	}

	@bindThis
	public async packLiteMany(
		avatars: MiWorldAvatar[],
		me?: { id: MiUser['id'] } | null | undefined,
	) {
		const _users = avatars.map(({ user, userId }) => user ?? userId);
		const _userMap = await this.userEntityService.packMany(_users, me)
			.then(users => new Map(users.map(u => [u.id, u])));
		return Promise.all(avatars.map(avatar => this.packLite(avatar, me, { packedUser: _userMap.get(avatar.userId) })));
	}

	@bindThis
	public async packDetailedMany(
		avatars: MiWorldAvatar[],
		me?: { id: MiUser['id'] } | null | undefined,
	) {
		const _users = avatars.map(({ user, userId }) => user ?? userId);
		const _userMap = await this.userEntityService.packMany(_users, me)
			.then(users => new Map(users.map(u => [u.id, u])));
		return Promise.all(avatars.map(avatar => this.packDetailed(avatar, me, { packedUser: _userMap.get(avatar.userId) })));
	}
}

