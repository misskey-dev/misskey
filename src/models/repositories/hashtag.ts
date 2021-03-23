import { EntityRepository, Repository } from 'typeorm';
import { Hashtag } from '../entities/hashtag';
import { SchemaType } from '@/misc/schema';

export type PackedHashtag = SchemaType<typeof packedHashtagSchema>;

@EntityRepository(Hashtag)
export class HashtagRepository extends Repository<Hashtag> {
	public async pack(
		src: Hashtag,
	): Promise<PackedHashtag> {
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
			description: 'The hashtag name. No # prefixed.',
			example: 'misskey',
		},
		mentionedUsersCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
			description: 'Number of all users using this hashtag.'
		},
		mentionedLocalUsersCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
			description: 'Number of local users using this hashtag.'
		},
		mentionedRemoteUsersCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
			description: 'Number of remote users using this hashtag.'
		},
		attachedUsersCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
			description: 'Number of all users who attached this hashtag to profile.'
		},
		attachedLocalUsersCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
			description: 'Number of local users who attached this hashtag to profile.'
		},
		attachedRemoteUsersCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
			description: 'Number of remote users who attached this hashtag to profile.'
		},
	}
};
