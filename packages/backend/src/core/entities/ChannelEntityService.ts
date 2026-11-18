/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type {
	ChannelFavoritesRepository,
	ChannelFollowingsRepository, ChannelMutingRepository,
	ChannelsRepository,
	DriveFilesRepository,
	MiDriveFile,
	MiNote,
	NotesRepository,
} from '@/models/_.js';
import type { Packed } from '@/misc/json-schema.js';
import type { MiUser } from '@/models/User.js';
import type { MiChannel } from '@/models/Channel.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { DriveFileEntityService } from './DriveFileEntityService.js';
import { NoteEntityService } from './NoteEntityService.js';

@Injectable()
export class ChannelEntityService {
	constructor(
		@Inject(DI.channelsRepository)
		private channelsRepository: ChannelsRepository,
		@Inject(DI.channelFollowingsRepository)
		private channelFollowingsRepository: ChannelFollowingsRepository,
		@Inject(DI.channelFavoritesRepository)
		private channelFavoritesRepository: ChannelFavoritesRepository,
		@Inject(DI.channelMutingRepository)
		private channelMutingRepository: ChannelMutingRepository,
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,
		private noteEntityService: NoteEntityService,
		private driveFileEntityService: DriveFileEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async pack(
		src: MiChannel['id'] | MiChannel,
		me?: { id: MiUser['id'] } | null | undefined,
		detailed?: boolean,
		opts?: {
			bannerFiles?: Map<MiDriveFile['id'], MiDriveFile>;
			followings?: Set<MiChannel['id']>;
			favorites?: Set<MiChannel['id']>;
			muting?: Set<MiChannel['id']>;
			pinnedNotes?: Map<MiNote['id'], MiNote>;
		},
	): Promise<Packed<'Channel'>> {
		const channel = typeof src === 'object' ? src : await this.channelsRepository.findOneByOrFail({ id: src });

		let bannerFile: MiDriveFile | null = null;
		if (channel.bannerId) {
			bannerFile = opts?.bannerFiles?.get(channel.bannerId)
				?? await this.driveFilesRepository.findOneByOrFail({ id: channel.bannerId });
		}

		let isFollowing = false;
		let isFavorited = false;
		let isMuting = false;
		if (me) {
			isFollowing = opts?.followings?.has(channel.id) ?? await this.channelFollowingsRepository.exists({
				where: {
					followerId: me.id,
					followeeId: channel.id,
				},
			});

			isFavorited = opts?.favorites?.has(channel.id) ?? await this.channelFavoritesRepository.exists({
				where: {
					userId: me.id,
					channelId: channel.id,
				},
			});

			isMuting = opts?.muting?.has(channel.id) ?? await this.channelMutingRepository.exists({
				where: {
					userId: me.id,
					channelId: channel.id,
				},
			});
		}

		// ピン留めノートの本体は詳細表示でしか使わない
		const pinnedNotes = Array.of<MiNote>();
		if (detailed && channel.pinnedNoteIds.length > 0) {
			pinnedNotes.push(
				...(
					opts?.pinnedNotes
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						? channel.pinnedNoteIds.map(it => opts.pinnedNotes!.get(it)).filter(it => it != null)
						: await this.notesRepository.findBy({ id: In(channel.pinnedNoteIds) })
				),
			);
		}

		return {
			id: channel.id,
			createdAt: this.idService.parse(channel.id).date.toISOString(),
			lastNotedAt: channel.lastNotedAt ? channel.lastNotedAt.toISOString() : null,
			name: channel.name,
			description: channel.description,
			userId: channel.userId,
			bannerUrl: bannerFile ? this.driveFileEntityService.getPublicUrl(bannerFile) : null,
			bannerId: channel.bannerId,
			pinnedNoteIds: channel.pinnedNoteIds,
			color: channel.color,
			isArchived: channel.isArchived,
			usersCount: channel.usersCount,
			notesCount: channel.notesCount,
			isSensitive: channel.isSensitive,
			allowRenoteToExternal: channel.allowRenoteToExternal,

			...(me ? {
				isFollowing,
				isFavorited,
				isMuting,
				hasUnreadNote: false, // 後方互換性のため
			} : {}),

			...(detailed ? {
				pinnedNotes: (await this.noteEntityService.packMany(pinnedNotes, me)).sort((a, b) => channel.pinnedNoteIds.indexOf(a.id) - channel.pinnedNoteIds.indexOf(b.id)),
			} : {}),
		};
	}

	@bindThis
	public async packMany(
		src: MiChannel['id'][] | MiChannel[],
		me?: { id: MiUser['id'] } | null | undefined,
		detailed?: boolean,
	): Promise<Packed<'Channel'>[]> {
		if (src.length === 0) return [];

		// IDのみの要素がある場合、DBからオブジェクトを取得して補う
		const idsToFetch = src.filter(it => typeof it !== 'object') as MiChannel['id'][];
		const fetchedChannels = idsToFetch.length > 0
			? await this.channelsRepository.findBy({ id: In(idsToFetch) })
			: [];
		const channelMap = new Map(
			[...(src.filter(it => typeof it === 'object') as MiChannel[]), ...fetchedChannels].map(it => [it.id, it]),
		);

		// 呼び出し元が指定した順序を保つ (取得できなかったIDは除く)
		const channels = src
			.map(it => typeof it === 'object' ? it : channelMap.get(it))
			.filter(it => it != null);
		const channelIds = channels.map(it => it.id);
		const bannerIds = channels.map(it => it.bannerId).filter(it => it != null);
		const pinnedNoteIds = channels.flatMap(it => it.pinnedNoteIds);

		const [bannerFiles, followings, favorites, muting, pinnedNotes] = await Promise.all([
			bannerIds.length > 0
				? this.driveFilesRepository
					.findBy({ id: In(bannerIds) })
					.then(it => new Map(it.map(it => [it.id, it])))
				: new Map<MiDriveFile['id'], MiDriveFile>(),
			me
				? this.channelFollowingsRepository
					.findBy({
						followerId: me.id,
						followeeId: In(channelIds),
					})
					.then(it => new Set(it.map(it => it.followeeId)))
				: new Set<MiChannel['id']>(),
			me
				? this.channelFavoritesRepository
					.findBy({
						userId: me.id,
						channelId: In(channelIds),
					})
					.then(it => new Set(it.map(it => it.channelId)))
				: new Set<MiChannel['id']>(),
			me
				? this.channelMutingRepository
					.findBy({
						userId: me.id,
						channelId: In(channelIds),
					})
					.then(it => new Set(it.map(it => it.channelId)))
				: new Set<MiChannel['id']>(),
			// ピン留めノートの本体は詳細表示でしか使わない
			detailed && pinnedNoteIds.length > 0
				? this.notesRepository
					.findBy({ id: In(pinnedNoteIds) })
					.then(it => new Map(it.map(it => [it.id, it])))
				: new Map<MiNote['id'], MiNote>(),
		]);

		return Promise.all(channels.map(it => this.pack(it, me, detailed, {
			bannerFiles,
			followings,
			favorites,
			muting,
			pinnedNotes,
		})));
	}
}

