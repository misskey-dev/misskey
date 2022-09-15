import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { ChannelFollowings, Channels, DriveFiles, NoteUnreads } from '@/models/index.js';
import { awaitAll } from '@/prelude/await-all.js';
import type { Packed } from '@/misc/schema.js';
import type { } from '@/models/entities/Blocking.js';
import type { User } from '@/models/entities/User.js';
import type { Channel } from '@/models/entities/Channel.js';
import { UserEntityService } from './UserEntityService.js';
import { DriveFileEntityService } from './DriveFileEntityService.js';

@Injectable()
export class ChannelEntityService {
	constructor(
		@Inject('channelsRepository')
		private channelsRepository: typeof Channels,

		@Inject('channelFollowingsRepository')
		private channelFollowingsRepository: typeof ChannelFollowings,

		@Inject('noteUnreadsRepository')
		private noteUnreadsRepository: typeof NoteUnreads,

		@Inject('driveFilesRepository')
		private driveFilesRepository: typeof DriveFiles,

		private userEntityService: UserEntityService,
		private driveFileEntityService: DriveFileEntityService,
	) {
	}

	public async pack(
		src: Channel['id'] | Channel,
		me?: { id: User['id'] } | null | undefined,
	): Promise<Packed<'Channel'>> {
		const channel = typeof src === 'object' ? src : await this.channelsRepository.findOneByOrFail({ id: src });
		const meId = me ? me.id : null;

		const banner = channel.bannerId ? await this.driveFilesRepository.findOneBy({ id: channel.bannerId }) : null;

		const hasUnreadNote = meId ? (await this.noteUnreadsRepository.findOneBy({ noteChannelId: channel.id, userId: meId })) != null : undefined;

		const following = meId ? await this.channelFollowingsRepository.findOneBy({
			followerId: meId,
			followeeId: channel.id,
		}) : null;

		return {
			id: channel.id,
			createdAt: channel.createdAt.toISOString(),
			lastNotedAt: channel.lastNotedAt ? channel.lastNotedAt.toISOString() : null,
			name: channel.name,
			description: channel.description,
			userId: channel.userId,
			bannerUrl: banner ? this.driveFileEntityService.getPublicUrl(banner, false) : null,
			usersCount: channel.usersCount,
			notesCount: channel.notesCount,

			...(me ? {
				isFollowing: following != null,
				hasUnreadNote,
			} : {}),
		};
	}
}

