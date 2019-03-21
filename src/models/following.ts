import { PrimaryGeneratedColumn, Entity, Index, OneToOne, JoinColumn, getRepository, Column, ManyToOne } from 'typeorm';
import { User } from './user';

@Entity()
@Index(['usernameLower', 'host'], { unique: true })
export class Following {
	@PrimaryGeneratedColumn()
	public id: number;

	@Index()
	@Column({
		type: 'date',
		comment: 'The created date of the Following.'
	})
	public createdAt: Date;

	@Index()
	@Column({
		type: 'varchar', length: 24,
		comment: 'The followee user ID.'
	})
	public followeeId: string;

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public followee: User | null;

	@Index()
	@Column({
		type: 'varchar', length: 24,
		comment: 'The follower user ID.'
	})
	public followerId: string;

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public follower: User | null;
}
