import { PrimaryColumn, Entity, Index, JoinColumn, Column, OneToOne } from 'typeorm';
import { User } from './user';
import { id } from '../id';

@Entity()
export class UserServiceLinking {
	@PrimaryColumn(id())
	public id: string;

	@Index({ unique: true })
	@Column(id())
	public userId: User['id'];

	@OneToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public user: User | null;

	@Column('jsonb', {
		nullable: true, default: null,
	})
	public twitter: Record<string, any> | null;

	@Column('jsonb', {
		nullable: true, default: null,
	})
	public github: Record<string, any> | null;

	@Column('jsonb', {
		nullable: true, default: null,
	})
	public discord: Record<string, any> | null;

	//#region Denormalized fields
	@Index()
	@Column('varchar', {
		length: 128, nullable: true,
		comment: '[Denormalized]'
	})
	public userHost: string | null;
	//#endregion
}
