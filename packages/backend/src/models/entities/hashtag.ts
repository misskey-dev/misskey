import { Entity, PrimaryColumn, Index, Column } from 'typeorm';
import { User } from './user';
import { id } from '../id';

@Entity()
export class Hashtag {
	@PrimaryColumn(id())
	public id: string;

	@Index({ unique: true })
	@Column('varchar', {
		length: 128
	})
	public name: string;

	@Column({
		...id(),
		array: true,
	})
	public mentionedUserIds: User['id'][];

	@Index()
	@Column('integer', {
		default: 0
	})
	public mentionedUsersCount: number;

	@Column({
		...id(),
		array: true,
	})
	public mentionedLocalUserIds: User['id'][];

	@Index()
	@Column('integer', {
		default: 0
	})
	public mentionedLocalUsersCount: number;

	@Column({
		...id(),
		array: true,
	})
	public mentionedRemoteUserIds: User['id'][];

	@Index()
	@Column('integer', {
		default: 0
	})
	public mentionedRemoteUsersCount: number;

	@Column({
		...id(),
		array: true,
	})
	public attachedUserIds: User['id'][];

	@Index()
	@Column('integer', {
		default: 0
	})
	public attachedUsersCount: number;

	@Column({
		...id(),
		array: true,
	})
	public attachedLocalUserIds: User['id'][];

	@Index()
	@Column('integer', {
		default: 0
	})
	public attachedLocalUsersCount: number;

	@Column({
		...id(),
		array: true,
	})
	public attachedRemoteUserIds: User['id'][];

	@Index()
	@Column('integer', {
		default: 0
	})
	public attachedRemoteUsersCount: number;
}
