import { PrimaryColumn, Entity, Index, Column } from 'typeorm';
import { id } from '../id';

@Entity()
export class UserPending {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone')
	public createdAt: Date;

	@Index({ unique: true })
	@Column('varchar', {
		length: 128,
	})
	public code: string;

	@Column('varchar', {
		length: 128,
	})
	public username: string;

	@Column('varchar', {
		length: 128,
	})
	public email: string;

	@Column('varchar', {
		length: 128,
	})
	public password: string;
}
