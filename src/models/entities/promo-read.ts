import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { Note } from './note';
import { User } from './user';
import { id } from '../id';

@Entity()
@Index(['userId', 'noteId'], { unique: true })
export class PromoRead {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
		comment: 'The created date of the PromoRead.'
	})
	public createdAt: Date;

	@Index()
	@Column(id())
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public user: User | null;

	@Column(id())
	public noteId: Note['id'];

	@ManyToOne(type => Note, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public note: Note | null;
}
