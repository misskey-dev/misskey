import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('reversi_matching')
export class MiReversiMatching {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column(id())
	public parentId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public parent: MiUser | null;

	@Index()
	@Column(id())
	public childId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public child: MiUser | null;
}
