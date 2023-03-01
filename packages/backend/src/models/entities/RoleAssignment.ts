import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from '../id.js';
import { Role } from './Role.js';
import { User } from './User.js';

@Entity()
@Index(['userId', 'roleId'], { unique: true })
export class RoleAssignment {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
		comment: 'The created date of the RoleAssignment.',
	})
	public createdAt: Date;

	@Index()
	@Column({
		...id(),
		comment: 'The user ID.',
	})
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: User | null;

	@Index()
	@Column({
		...id(),
		comment: 'The role ID.',
	})
	public roleId: Role['id'];

	@ManyToOne(type => Role, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public role: Role | null;

	@Index()
	@Column('timestamp with time zone', {
		nullable: true,
	})
	public expiresAt: Date | null;
}
