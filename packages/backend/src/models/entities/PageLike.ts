import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from '../id.js';
import { User } from './User.js';
import { Page } from './Page.js';

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
