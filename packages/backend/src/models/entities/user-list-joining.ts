import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user';
import { UserList } from './user-list';
import { id } from '../id';

@Entity()
@Index(['userId', 'userListId'], { unique: true })
export class UserListJoining {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
		comment: 'The created date of the UserListJoining.',
	})
	public createdAt: Date;

	@Index()
	@Column({
		...id(),
		comment: 'The user ID.',
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
		comment: 'The list ID.',
	})
	public userListId: UserList['id'];

	@ManyToOne(type => UserList, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public userList: UserList | null;
}
