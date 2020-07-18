import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user';
import { id } from '../id';
import { UserList } from './user-list';
import { UserGroupJoining } from './user-group-joining';

@Entity()
export class Antenna {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
		comment: 'The created date of the Antenna.'
	})
	public createdAt: Date;

	@Index()
	@Column({
		...id(),
		comment: 'The owner ID.'
	})
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public user: User | null;

	@Column('varchar', {
		length: 128,
		comment: 'The name of the Antenna.'
	})
	public name: string;

	@Column('enum', { enum: ['home', 'all', 'users', 'list', 'group'] })
	public src: 'home' | 'all' | 'users' | 'list' | 'group';

	@Column({
		...id(),
		nullable: true
	})
	public userListId: UserList['id'] | null;

	@ManyToOne(type => UserList, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public userList: UserList | null;

	@Column({
		...id(),
		nullable: true
	})
	public userGroupJoiningId: UserGroupJoining['id'] | null;

	@ManyToOne(type => UserGroupJoining, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public userGroupJoining: UserGroupJoining | null;

	@Column('varchar', {
		length: 1024, array: true,
		default: '{}'
	})
	public users: string[];

	@Column('jsonb', {
		default: []
	})
	public keywords: string[][];

	@Column('jsonb', {
		default: []
	})
	public excludeKeywords: string[][];

	@Column('boolean', {
		default: false
	})
	public caseSensitive: boolean;

	@Column('boolean', {
		default: false
	})
	public withReplies: boolean;

	@Column('boolean')
	public withFile: boolean;

	@Column('varchar', {
		length: 2048, nullable: true,
	})
	public expression: string | null;

	@Column('boolean')
	public notify: boolean;
}
