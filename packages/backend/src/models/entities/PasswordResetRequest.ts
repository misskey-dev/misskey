import { PrimaryColumn, Entity, Index, Column, ManyToOne, JoinColumn } from 'typeorm';
import { id } from '../id.js';
import { User } from './User.js';

@Entity()
export class PasswordResetRequest {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone')
	public createdAt: Date;

	@Index({ unique: true })
	@Column('varchar', {
		length: 256,
	})
	public token: string;

	@Index()
	@Column({
		...id(),
	})
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: User | null;
}
