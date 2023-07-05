import { PrimaryColumn, Entity, Index, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { id } from '../id.js';
import { User } from './User.js';

@Entity()
export class RegistrationTicket {
	@PrimaryColumn(id())
	public id: string;

	@Index({ unique: true })
	@Column('varchar', {
		length: 64,
	})
	public code: string;

	@Column('timestamp with time zone', {
		nullable: true,
	})
	public expiresAt: Date | null;

	@Column('timestamp with time zone')
	public createdAt: Date;

	@ManyToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public createdBy: User | null;

	@OneToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public usedBy: User | null;

	@Column('timestamp with time zone', {
		nullable: true,
	})
	public usedAt: Date | null;

	@Column('varchar', {
		length: 32,
		nullable: true,
	})
	public pendingUserId: string | null;
}
