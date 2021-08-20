import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../user';
import { id } from '../../../id';

@Entity()
export class ReversiMatching {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the ReversiMatching.'
	})
	public createdAt: Date;

	@Index()
	@Column(id())
	public parentId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public parent: User | null;

	@Index()
	@Column(id())
	public childId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public child: User | null;
}
