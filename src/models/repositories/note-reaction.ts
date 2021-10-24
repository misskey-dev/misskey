import { EntityRepository, Repository } from 'typeorm';
import { NoteReaction } from '@/models/entities/note-reaction';
import { Notes, Users } from '../index';
import { Packed } from '@/misc/schema';
import { convertLegacyReaction } from '@/misc/reaction-lib';
import { User } from '@/models/entities/user';

@EntityRepository(NoteReaction)
export class NoteReactionRepository extends Repository<NoteReaction> {
	public async pack(
		src: NoteReaction['id'] | NoteReaction,
		me?: { id: User['id'] } | null | undefined,
		options?: {
			withNote: boolean;
		},
	): Promise<Packed<'NoteReaction'>> {
		const opts = Object.assign({
			withNote: false,
		}, options);

		const reaction = typeof src === 'object' ? src : await this.findOneOrFail(src);

		return {
			id: reaction.id,
			createdAt: reaction.createdAt.toISOString(),
			user: await Users.pack(reaction.userId, me),
			type: convertLegacyReaction(reaction.reaction),
			...(opts.withNote ? {
				note: await Notes.pack(reaction.noteId, me),
			} : {})
		};
	}
}

export const packedNoteReactionSchema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		id: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'date-time',
		},
		user: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'User' as const,
		},
		type: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
		},
	},
};
