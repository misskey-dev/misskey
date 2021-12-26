import { Entity, PrimaryColumn, Index, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user';
import { App } from './app';
import { id } from '../id';

@Entity()
export class AccessToken {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
		comment: 'The created date of the AccessToken.',
	})
	public createdAt: Date;

	@Column('timestamp with time zone', {
		nullable: true,
		default: null,
	})
	public lastUsedAt: Date | null;

	@Index()
	@Column('varchar', {
		length: 128,
	})
	public token: string;

	@Index()
	@Column('varchar', {
		length: 128,
		nullable: true,
		default: null,
	})
	public session: string | null;

	@Index()
	@Column('varchar', {
		length: 128,
	})
	public hash: string;

	@Index()
	@Column(id())
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: User | null;

	@Column({
		...id(),
		nullable: true,
		default: null,
	})
	public appId: App['id'] | null;

	@ManyToOne(type => App, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public app: App | null;

	@Column('varchar', {
		length: 128,
		nullable: true,
		default: null,
	})
	public name: string | null;

	@Column('varchar', {
		length: 512,
		nullable: true,
		default: null,
	})
	public description: string | null;

	@Column('varchar', {
		length: 512,
		nullable: true,
		default: null,
	})
	public iconUrl: string | null;

	@Column('varchar', {
		length: 64, array: true,
		default: '{}',
	})
	public permission: string[];

	@Column('boolean', {
		default: false,
	})
	public fetched: boolean;
}
