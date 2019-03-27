import { EntityRepository, Repository } from 'typeorm';
import { NoteReaction } from '../entities/note-reaction';
import { Users } from '..';

@EntityRepository(NoteReaction)
export class NoteReactionRepository extends Repository<NoteReaction> {
	public async pack(
		reaction: NoteReaction['id'] | NoteReaction,
		me?: any
	) {
		const _reaction = typeof reaction === 'object' ? reaction : await this.findOne(reaction);

		return {
			id: _reaction.id,
			user: await Users.pack(_reaction.userId, me),
		};
	}
}
