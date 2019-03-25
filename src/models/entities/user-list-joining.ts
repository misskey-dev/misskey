import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user';
import { UserList } from './user-list';

@Entity()
export class UserListJoining {
	@PrimaryColumn('char', { length: 26 })
	public id: string;

	@Column('date', {
		comment: 'The created date of the UserListJoining.'
	})
	public createdAt: Date;

	@Index()
	@Column('integer', {
		comment: 'The user ID.'
	})
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public user: User | null;

	@Index()
	@Column('integer', {
		comment: 'The list ID.'
	})
	public userListId: UserList['id'];

	@ManyToOne(type => UserList, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public userList: UserList | null;
}
