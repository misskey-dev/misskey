import { EntityRepository, Repository } from 'typeorm';
import { NoteReaction } from '../entities/note-reaction';
import { Users } from '..';
import { ensure } from '../../prelude/ensure';

@EntityRepository(NoteReaction)
export class NoteReactionRepository extends Repository<NoteReaction> {
	public async pack(
		src: NoteReaction['id'] | NoteReaction,
		me?: any
	) {
		const reaction = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		return {
			id: reaction.id,
			user: await Users.pack(reaction.userId, me),
		};
	}
}
