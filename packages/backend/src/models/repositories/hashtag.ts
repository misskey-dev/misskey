import { EntityRepository, Repository } from 'typeorm';
import { Hashtag } from '@/models/entities/hashtag';
import { Packed } from '@/misc/schema';

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

export const packedHashtagSchema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		tag: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			example: 'misskey',
		},
		mentionedUsersCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
		},
		mentionedLocalUsersCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
		},
		mentionedRemoteUsersCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
		},
		attachedUsersCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
		},
		attachedLocalUsersCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
		},
		attachedRemoteUsersCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
		},
	},
};
