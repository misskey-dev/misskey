import { EntityRepository, Repository } from 'typeorm';
import { NoteReaction } from '../entities/note-reaction';
import { Users } from '..';
import { ensure } from '../../prelude/ensure';
import { types, bool, SchemaType } from '../../misc/schema';

export type PackedNoteReaction = SchemaType<typeof packedNoteReactionSchema>;

@EntityRepository(NoteReaction)
export class NoteReactionRepository extends Repository<NoteReaction> {
	public async pack(
		src: NoteReaction['id'] | NoteReaction,
		me?: unknown
	): Promise<PackedNoteReaction> {
		const reaction = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		return {
			id: reaction.id,
			createdAt: reaction.createdAt.toISOString(),
			user: await Users.pack(reaction.userId, me),
			type: reaction.reaction,
		};
	}
}

export const packedNoteReactionSchema = {
	type: types.object,
	optional: bool.false, nullable: bool.false,
	properties: {
		id: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'id',
			description: 'The unique identifier for this reaction.',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'date-time',
			description: 'The date that the reaction was created.'
		},
		user: {
			type: types.object,
			optional: bool.false, nullable: bool.false,
			ref: 'User',
			description: 'User who performed this reaction.'
		},
		type: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			description: 'The reaction type.'
		},
	},
};
