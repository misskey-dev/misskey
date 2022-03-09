import { EntityRepository, Repository } from 'typeorm';
import { Antenna } from '@/models/entities/antenna.js';
import { Packed } from '@/misc/schema.js';
import { AntennaNotes, UserGroupJoinings } from '../index.js';

@EntityRepository(Antenna)
export class AntennaRepository extends Repository<Antenna> {
	public async pack(
		src: Antenna['id'] | Antenna,
	): Promise<Packed<'Antenna'>> {
		const antenna = typeof src === 'object' ? src : await this.findOneOrFail(src);

		const hasUnreadNote = (await AntennaNotes.findOne({ antennaId: antenna.id, read: false })) != null;
		const userGroupJoining = antenna.userGroupJoiningId ? await UserGroupJoinings.findOne(antenna.userGroupJoiningId) : null;

		return {
			id: antenna.id,
			createdAt: antenna.createdAt.toISOString(),
			name: antenna.name,
			keywords: antenna.keywords,
			excludeKeywords: antenna.excludeKeywords,
			src: antenna.src,
			userListId: antenna.userListId,
			userGroupId: userGroupJoining ? userGroupJoining.userGroupId : null,
			users: antenna.users,
			caseSensitive: antenna.caseSensitive,
			notify: antenna.notify,
			withReplies: antenna.withReplies,
			withFile: antenna.withFile,
			hasUnreadNote,
		};
	}
}
