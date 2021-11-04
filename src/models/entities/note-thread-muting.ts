import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user';
import { Note } from './note';
import { id } from '../id';

@Entity()
@Index(['userId', 'threadId'], { unique: true })
export class NoteThreadMuting {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
	})
	public createdAt: Date;

	@Index()
	@Column({
		...id(),
	})
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public user: User | null;

	@Index()
	@Column('varchar', {
		length: 256,
	})
	public threadId: string;
}
