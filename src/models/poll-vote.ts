import { PrimaryGeneratedColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user';
import { Note } from './note';

@Entity()
@Index(['userId', 'noteId', 'choice'], { unique: true })
export class PollVote {
	@PrimaryGeneratedColumn()
	public id: number;

	@Index()
	@Column({
		type: 'date',
		comment: 'The created date of the PollVote.'
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
		type: 'integer'
	})
	public choice: number;
}
