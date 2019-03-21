import { Entity, PrimaryGeneratedColumn, Index, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user';

@Entity()
export class AccessToken {
	@PrimaryGeneratedColumn()
	public id: number;

	@Column({
		type: 'date',
		comment: 'The created date of the AccessToken.'
	})
	public createdAt: Date;

	@Index()
	@Column({
		type: 'varchar', length: 128
	})
	public token: string;

	@Index()
	@Column({
		type: 'varchar', length: 128
	})
	public hash: string;

	@Column({
		type: 'varchar', length: 24,
	})
	public userId: string;

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public user: User | null;

	@Column({
		type: 'integer',
	})
	public appId: string;

	@ManyToOne(type => App, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public app: App | null;
}
