import { Entity, Index, JoinColumn, Column, PrimaryColumn, ManyToOne } from 'typeorm';
import { id } from '../id.js';
import { User } from './User.js';

@Entity()
export class Flash {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the Flash.',
	})
	public createdAt: Date;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The updated date of the Flash.',
	})
	public updatedAt: Date;

	@Column('varchar', {
		length: 256,
	})
	public title: string;

	@Column('varchar', {
		length: 1024,
	})
	public summary: string;

	@Index()
	@Column({
		...id(),
		comment: 'The ID of author.',
	})
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: User | null;

	@Column('varchar', {
		length: 65536,
	})
	public script: string;

	@Column('varchar', {
		length: 256, array: true, default: '{}',
	})
	public permissions: string[];

	@Column('integer', {
		default: 0,
	})
	public likedCount: number;
}
