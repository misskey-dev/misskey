import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user';
import { id } from '../id';

@Entity()
@Index(['blockerId', 'blockeeId'], { unique: true })
export class Blocking {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the Blocking.'
	})
	public createdAt: Date;

	@Index()
	@Column({
		...id(),
		comment: 'The blockee user ID.'
	})
	public blockeeId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public blockee: User | null;

	@Index()
	@Column({
		...id(),
		comment: 'The blocker user ID.'
	})
	public blockerId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public blocker: User | null;
}
