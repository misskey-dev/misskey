import { db } from '@/db/postgre.js';
import { Channel } from '@/models/entities/channel.js';
import { Packed } from '@/misc/schema.js';
import { DriveFiles, ChannelFollowings, NoteUnreads } from '../index.js';
import { User } from '@/models/entities/user.js';

export const ChannelRepository = db.getRepository(Channel).extend({
	async pack(
		src: Channel['id'] | Channel,
		me?: { id: User['id'] } | null | undefined,
	): Promise<Packed<'Channel'>> {
		const channel = typeof src === 'object' ? src : await this.findOneByOrFail({ id: src });
		const meId = me ? me.id : null;

		const banner = channel.bannerId ? await DriveFiles.findOneBy({ id: channel.bannerId }) : null;

		const hasUnreadNote = meId ? (await NoteUnreads.findOneBy({ noteChannelId: channel.id, userId: meId })) != null : undefined;

		const following = meId ? await ChannelFollowings.findOneBy({
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
	},
});
