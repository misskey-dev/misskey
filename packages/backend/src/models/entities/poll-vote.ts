import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user';
import { Note } from './note';
import { id } from '../id';

@Entity()
@Index(['userId', 'noteId', 'choice'], { unique: true })
export class PollVote {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the PollVote.',
	})
	public createdAt: Date;

	@Index()
	@Column(id())
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: User | null;

	@Index()
	@Column(id())
	public noteId: Note['id'];

	@ManyToOne(type => Note, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public note: Note | null;

	@Column('integer')
	public choice: number;
}
