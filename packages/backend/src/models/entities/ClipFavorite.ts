import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from '../id.js';
import { User } from './User.js';
import { Clip } from './Clip.js';

@Entity()
@Index(['userId', 'clipId'], { unique: true })
export class ClipFavorite {
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
	public clipId: Clip['id'];

	@ManyToOne(type => Clip, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public clip: Clip | null;
}
