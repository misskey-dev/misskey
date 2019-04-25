import { EntityRepository, Repository } from 'typeorm';
import { Hashtag } from '../entities/hashtag';
import { SchemaType, types, bool } from '../../misc/schema';

export type PackedHashtag = SchemaType<typeof packedHashtagSchema>;

@EntityRepository(Hashtag)
export class HashtagRepository extends Repository<Hashtag> {
	public packMany(
		hashtags: Hashtag[],
	) {
		return Promise.all(hashtags.map(x => this.pack(x)));
	}

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
}

export const packedHashtagSchema = {
	type: types.object,
	optional: bool.false, nullable: bool.false,
	properties: {
		tag: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			description: 'The hashtag name. No # prefixed.',
			example: 'misskey',
		},
		mentionedUsersCount: {
			type: types.number,
			optional: bool.false, nullable: bool.false,
			description: 'Number of all users using this hashtag.'
		},
		mentionedLocalUsersCount: {
			type: types.number,
			optional: bool.false, nullable: bool.false,
			description: 'Number of local users using this hashtag.'
		},
		mentionedRemoteUsersCount: {
			type: types.number,
			optional: bool.false, nullable: bool.false,
			description: 'Number of remote users using this hashtag.'
		},
		attachedUsersCount: {
			type: types.number,
			optional: bool.false, nullable: bool.false,
			description: 'Number of all users who attached this hashtag to profile.'
		},
		attachedLocalUsersCount: {
			type: types.number,
			optional: bool.false, nullable: bool.false,
			description: 'Number of local users who attached this hashtag to profile.'
		},
		attachedRemoteUsersCount: {
			type: types.number,
			optional: bool.false, nullable: bool.false,
			description: 'Number of remote users who attached this hashtag to profile.'
		},
	}
};
