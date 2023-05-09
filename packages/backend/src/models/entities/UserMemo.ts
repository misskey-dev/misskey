import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { id } from '../id.js';
import { User } from './User.js';

@Entity()
@Index(['userId', 'targetUserId'], { unique: true })
export class UserMemo {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		comment: 'The ID of author.',
	})
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: User | null;

	@Index()
	@Column({
		...id(),
		comment: 'The ID of target user.',
	})
	public targetUserId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public targetUser: User | null;

	@Column('varchar', {
		length: 2048,
		comment: 'Memo.',
	})
	public memo: string;
}
