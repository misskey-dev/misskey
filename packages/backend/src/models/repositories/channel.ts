import { EntityRepository, Repository } from 'typeorm';
import { Channel } from '@/models/entities/channel.js';
import { Packed } from '@/misc/schema.js';
import { DriveFiles, ChannelFollowings, NoteUnreads } from '../index.js';
import { User } from '@/models/entities/user.js';

@EntityRepository(Channel)
export class ChannelRepository extends Repository<Channel> {
	public async pack(
		src: Channel['id'] | Channel,
		me?: { id: User['id'] } | null | undefined,
	): Promise<Packed<'Channel'>> {
		const channel = typeof src === 'object' ? src : await this.findOneOrFail(src);
		const meId = me ? me.id : null;

		const banner = channel.bannerId ? await DriveFiles.findOne(channel.bannerId) : null;

		const hasUnreadNote = meId ? (await NoteUnreads.findOne({ noteChannelId: channel.id, userId: meId })) != null : undefined;

		const following = meId ? await ChannelFollowings.findOne({
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
			bannerUrl: banner ? DriveFiles.getPublicUrl(banner, false) : null,
			usersCount: channel.usersCount,
			notesCount: channel.notesCount,

			...(me ? {
				isFollowing: following != null,
				hasUnreadNote,
			} : {}),
		};
	}
}
