/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { ChannelFavoritesRepository, ChannelFollowingsRepository, ChannelsRepository, DriveFilesRepository, NoteUnreadsRepository, NotesRepository } from '@/models/index.js';
import type { Packed } from '@/misc/json-schema.js';
import type { } from '@/models/entities/Blocking.js';
import type { User } from '@/models/entities/User.js';
import type { Channel } from '@/models/entities/Channel.js';
import { bindThis } from '@/decorators.js';
import { DriveFileEntityService } from './DriveFileEntityService.js';
import { NoteEntityService } from './NoteEntityService.js';
import { In } from 'typeorm';

@Injectable()
export class ChannelEntityService {
	constructor(
		@Inject(DI.channelsRepository)
		private channelsRepository: ChannelsRepository,

		@Inject(DI.channelFollowingsRepository)
		private channelFollowingsRepository: ChannelFollowingsRepository,

		@Inject(DI.channelFavoritesRepository)
		private channelFavoritesRepository: ChannelFavoritesRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.noteUnreadsRepository)
		private noteUnreadsRepository: NoteUnreadsRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private noteEntityService: NoteEntityService,
		private driveFileEntityService: DriveFileEntityService,
	) {
	}

	@bindThis
	public async pack(
		src: Channel['id'] | Channel,
		me?: { id: User['id'] } | null | undefined,
		detailed?: boolean,
	): Promise<Packed<'Channel'>> {
		const channel = typeof src === 'object' ? src : await this.channelsRepository.findOneByOrFail({ id: src });
		const meId = me ? me.id : null;

		const banner = channel.bannerId ? await this.driveFilesRepository.findOneBy({ id: channel.bannerId }) : null;

		const hasUnreadNote = meId ? await this.noteUnreadsRepository.exist({
			where: {
				noteChannelId: channel.id,
				userId: meId,
			},
		}) : undefined;

		const isFollowing = meId ? await this.channelFollowingsRepository.exist({
			where: {
				followerId: meId,
				followeeId: channel.id,
			},
		}) : false;

		const isFavorited = meId ? await this.channelFavoritesRepository.exist({
			where: {
				userId: meId,
				channelId: channel.id,
			},
		}) : false;

		const pinnedNotes = channel.pinnedNoteIds.length > 0 ? await this.notesRepository.find({
			where: {
				id: In(channel.pinnedNoteIds),
			},
		}) : [];

		return {
			id: channel.id,
			createdAt: channel.createdAt.toISOString(),
			lastNotedAt: channel.lastNotedAt ? channel.lastNotedAt.toISOString() : null,
			name: channel.name,
			description: channel.description,
			userId: channel.userId,
			bannerUrl: banner ? this.driveFileEntityService.getPublicUrl(banner) : null,
			pinnedNoteIds: channel.pinnedNoteIds,
			color: channel.color,
			isArchived: channel.isArchived,
			usersCount: channel.usersCount,
			notesCount: channel.notesCount,

			...(me ? {
				isFollowing,
				isFavorited,
				hasUnreadNote,
			} : {}),

			...(detailed ? {
				pinnedNotes: (await this.noteEntityService.packMany(pinnedNotes, me)).sort((a, b) => channel.pinnedNoteIds.indexOf(a.id) - channel.pinnedNoteIds.indexOf(b.id)),
			} : {}),
		};
	}
}

