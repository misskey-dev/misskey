import { PrimaryGeneratedColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user';
import { UserList } from './user-list';

@Entity()
export class UserListJoining {
	@PrimaryGeneratedColumn()
	public id: number;

	@Column('date', {
		comment: 'The created date of the UserListJoining.'
	})
	public createdAt: Date;

	@Index()
	@Column('varchar', {
		length: 24,
		comment: 'The user ID.'
	})
	public userId: string;

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public user: User | null;

	@Index()
	@Column('integer', {
		comment: 'The list ID.'
	})
	public userListId: number;

	@ManyToOne(type => UserList, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public userList: UserList | null;
}
