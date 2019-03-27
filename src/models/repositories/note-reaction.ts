import { EntityRepository, Repository } from 'typeorm';
import { NoteReaction } from '../entities/note-reaction';
import { Users } from '..';

@EntityRepository(NoteReaction)
export class NoteReactionRepository extends Repository<NoteReaction> {
	private async cloneOrFetch(x: NoteReaction['id'] | NoteReaction): Promise<NoteReaction> {
		if (typeof x === 'object') {
			return JSON.parse(JSON.stringify(x));
		} else {
			return await this.findOne(x);
		}
	}

	public async pack(
		reaction: any,
		me?: any
	) {
		const _reaction = await this.cloneOrFetch(reaction);

		return {
			id: _reaction.id,
			user: await Users.pack(_reaction.userId, me),
		};
	}
}
