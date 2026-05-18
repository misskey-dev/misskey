/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { AntennaFavoritesRepository, AntennasRepository, MiUser } from '@/models/_.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/json-schema.js';
import type { MiAntenna } from '@/models/Antenna.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class AntennaEntityService {
	constructor(
		@Inject(DI.antennasRepository)
		private antennasRepository: AntennasRepository,

		@Inject(DI.antennaFavoritesRepository)
		private antennaFavoritesRepository: AntennaFavoritesRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async pack(
		src: MiAntenna['id'] | MiAntenna,
		me?: { id: MiUser['id'] } | null | undefined,
		hint?: {
			packedUser?: Packed<'UserLite'>,
		},
	): Promise<Packed<'Antenna'>> {
		const meId = me ? me.id : null;
		const antenna = typeof src === 'object' ? src : await this.antennasRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: antenna.id,
			createdAt: this.idService.parse(antenna.id).date.toISOString(),
			name: antenna.name,
			keywords: antenna.keywords,
			excludeKeywords: antenna.excludeKeywords,
			src: antenna.src,
			userListId: antenna.userListId,
			users: antenna.users,
			caseSensitive: antenna.caseSensitive,
			localOnly: antenna.localOnly,
			excludeBots: antenna.excludeBots,
			withReplies: antenna.withReplies,
			withFile: antenna.withFile,
			excludeNotesInSensitiveChannel: antenna.excludeNotesInSensitiveChannel,
			isActive: antenna.isActive,
			hasUnreadNote: false, // TODO
			notify: false, // 後方互換性のため
			isPublic: antenna.isPublic,
			userId: antenna.userId,
			user: hint?.packedUser ?? this.userEntityService.pack(antenna.user ?? antenna.userId),
			favoritedCount: await this.antennaFavoritesRepository.countBy({ antennaId: antenna.id }),
			isFavorited: meId ? await this.antennaFavoritesRepository.exists({ where: { antennaId: antenna.id, userId: meId } }) : undefined,
		});
	}

	@bindThis
	public async packMany(
		antennas: MiAntenna[],
		me?: { id: MiUser['id'] } | null | undefined,
	) {
		const _users = antennas.map(({ user, userId }) => user ?? userId);
		const _userMap = await this.userEntityService.packMany(_users, me)
			.then(users => new Map(users.map(u => [u.id, u])));
		return Promise.all(antennas.map(antenna => this.pack(antenna, me, { packedUser: _userMap.get(antenna.userId) })));
	}
}
