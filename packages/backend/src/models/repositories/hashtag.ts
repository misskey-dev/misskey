import { db } from '@/db/postgre.js';
import { Hashtag } from '@/models/entities/hashtag.js';
import { Packed } from '@/misc/schema.js';

export const HashtagRepository = db.getRepository(Hashtag).extend({
	async pack(
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
	},

	packMany(
		hashtags: Hashtag[],
	) {
		return Promise.all(hashtags.map(x => this.pack(x)));
	},
});
