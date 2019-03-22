import { Entity, PrimaryGeneratedColumn, Index, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user';
import { App } from './app';

@Entity()
export class AccessToken {
	@PrimaryGeneratedColumn()
	public id: number;

	@Column('date', {
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

	@Column('varchar', {
		length: 24,
	})
	public userId: string;

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public user: User | null;

	@Column('integer')
	public appId: string;

	@ManyToOne(type => App, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public app: App | null;
}
