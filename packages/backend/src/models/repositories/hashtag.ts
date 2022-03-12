import { EntityRepository, Repository } from 'typeorm';
import { Hashtag } from '@/models/entities/hashtag.js';
import { Packed } from '@/misc/schema.js';

@EntityRepository(Hashtag)
export class HashtagRepository extends Repository<Hashtag> {
	public async pack(
		src: Hashtag,
	): Promise<Packed<'Hashtag'>> {
		return {
			tag: src.name,
			mentionedUsersCount: src.mentionedUsersCount,
			mentionedLocalUsersCount: src.mentionedLocalUsersCount,
			mentionedRemoteUsersCount: src.mentionedRemoteUsersCount,
			attachedUsersCount: src.attachedUsersCount,
			attachedLocalUsersCount: src.attachedLocalUsersCount,
			attachedRemoteUsersCount: src.attachedRemoteUsersCount,
		};
	}

	public packMany(
		hashtags: Hashtag[],
	) {
		return Promise.all(hashtags.map(x => this.pack(x)));
	}
}
