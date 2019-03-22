import { PrimaryGeneratedColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user';

@Entity()
@Index(['followerId', 'followeeId'], { unique: true })
export class Following {
	@PrimaryGeneratedColumn()
	public id: number;

	@Index()
	@Column('date', {
		comment: 'The created date of the Following.'
	})
	public createdAt: Date;

	@Index()
	@Column('varchar', {
		length: 24,
		comment: 'The followee user ID.'
	})
	public followeeId: string;

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public followee: User | null;

	@Index()
	@Column('varchar', {
		length: 24,
		comment: 'The follower user ID.'
	})
	public followerId: string;

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public follower: User | null;
}
