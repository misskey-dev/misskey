import { Entity, Index, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('user_account_move_log')
export class MiUserAccountMoveLog {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column(id())
	public movedToId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public movedTo: MiUser | null;

	@Index()
	@Column(id())
	public movedFromId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public movedFrom: MiUser | null;

	@Column('timestamp with time zone', {
		comment: 'The created date of the UserIp.',
		default: () => 'CURRENT_TIMESTAMP',
	})
	public createdAt: Date;
}
