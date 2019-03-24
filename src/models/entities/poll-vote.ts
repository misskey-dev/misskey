import { PrimaryGeneratedColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user';
import { Note } from './note';

@Entity()
@Index(['userId', 'noteId', 'choice'], { unique: true })
export class PollVote {
	@PrimaryGeneratedColumn()
	public id: number;

	@Index()
	@Column('date', {
		comment: 'The created date of the PollVote.'
	})
	public createdAt: Date;

	@Index()
	@Column('integer')
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public user: User | null;

	@Index()
	@Column('integer')
	public noteId: Note['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public note: Note | null;

	@Column('integer')
	public choice: number;
}
