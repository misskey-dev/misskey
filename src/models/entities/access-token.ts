import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user';
import { App } from './app';
import { id } from '../id';

@Entity()
export class AccessToken {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
		comment: 'The created date of the AccessToken.'
	})
	public createdAt: Date;

	@Index()
	@Column('varchar', {
		length: 128
	})
	public token: string;

	@Index()
	@Column('varchar', {
		length: 128
	})
	public hash: string;

	@Index()
	@Column(id())
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public user: User | null;

	@Column(id())
	public appId: App['id'];

	@ManyToOne(type => App, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public app: App | null;
}
