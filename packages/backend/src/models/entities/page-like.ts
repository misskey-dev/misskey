import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user';
import { id } from '../id';
import { Page } from './page';

@Entity()
@Index(['userId', 'pageId'], { unique: true })
export class PageLike {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone')
	public createdAt: Date;

	@Index()
	@Column(id())
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: User | null;

	@Column(id())
	public pageId: Page['id'];

	@ManyToOne(type => Page, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public page: Page | null;
}
