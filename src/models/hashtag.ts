import { Entity, PrimaryGeneratedColumn, Index, Column } from 'typeorm';
import { User } from './user';

@Entity()
export class Hashtag {
	@PrimaryGeneratedColumn()
	public id: number;

	@Index({ unique: true })
	@Column('varchar', {
		length: 128
	})
	public tag: string;

	@Column('simple-array', {
		default: []
	})
	public mentionedUserIds: User['id'][];

	@Index()
	@Column('integer', {
		default: 0
	})
	public mentionedUsersCount: number;

	@Column('simple-array', {
		default: []
	})
	public mentionedLocalUserIds: User['id'][];

	@Index()
	@Column('integer', {
		default: 0
	})
	public mentionedLocalUsersCount: number;

	@Column('simple-array', {
		default: []
	})
	public mentionedRemoteUserIds: User['id'][];

	@Index()
	@Column('integer', {
		default: 0
	})
	public mentionedRemoteUsersCount: number;

	@Column('simple-array', {
		default: []
	})
	public attachedUserIds: User['id'][];

	@Index()
	@Column('integer', {
		default: 0
	})
	public attachedUsersCount: number;

	@Column('simple-array', {
		default: []
	})
	public attachedLocalUserIds: User['id'][];

	@Index()
	@Column('integer', {
		default: 0
	})
	public attachedLocalUsersCount: number;

	@Column('simple-array', {
		default: []
	})
	public attachedRemoteUserIds: User['id'][];

	@Index()
	@Column('integer', {
		default: 0
	})
	public attachedRemoteUsersCount: number;
}
