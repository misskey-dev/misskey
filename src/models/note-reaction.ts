import { PrimaryGeneratedColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import * as deepcopy from 'deepcopy';
import { pack as packUser } from './user';
import { User } from './user';
import { Note } from './note';

@Entity()
@Index(['userId', 'noteId'], { unique: true })
export class NoteReaction {
	@PrimaryGeneratedColumn()
	public id: number;

	@Index()
	@Column({
		type: 'date',
		comment: 'The created date of the NoteReaction.'
	})
	public createdAt: Date;

	@Index()
	@Column({
		type: 'varchar', length: 24,
	})
	public userId: string;

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public user: User | null;

	@Index()
	@Column({
		type: 'integer'
	})
	public noteId: number;

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public note: Note | null;

	@Column({
		type: 'varchar', length: 32
	})
	public reaction: string;
}

/**
 * Pack a reaction for API response
 */
export const pack = (
	reaction: any,
	me?: any
) => new Promise<any>(async (resolve, reject) => {
	let _reaction: any;

	// Populate the reaction if 'reaction' is ID
	if (isObjectId(reaction)) {
		_reaction = await NoteReaction.findOne({
			_id: reaction
		});
	} else if (typeof reaction === 'string') {
		_reaction = await NoteReaction.findOne({
			_id: new mongo.ObjectID(reaction)
		});
	} else {
		_reaction = deepcopy(reaction);
	}

	// Rename _id to id
	_reaction.id = _reaction.id;
	delete _reaction.id;

	// Populate user
	_reaction.user = await packUser(_reaction.userId, me);

	resolve(_reaction);
});
