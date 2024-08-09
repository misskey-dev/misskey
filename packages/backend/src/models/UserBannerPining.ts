import { Entity, Column, Index, JoinColumn, PrimaryColumn, ManyToOne, OneToOne } from 'typeorm';
import { MiUserBanner } from '@/models/UserBanner.js';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('user_banner_pining')
@Index(['userId', 'pinnedBannerId'], { unique: true })
export class MiUserBannerPining {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column(id())
	public userId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Column({
		...id(),
	})
	public pinnedBannerId: MiUserBanner['id'];

	@ManyToOne(type => MiUserBanner, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public pinnedBanner: MiUserBanner;
}
