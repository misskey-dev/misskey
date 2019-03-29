import { PrimaryColumn, Entity, Index, JoinColumn, Column, OneToOne } from 'typeorm';
import { User } from './user';
import { id } from '../id';

@Entity({
	orderBy: {
		id: 'DESC'
	}
})
export class UserKeypair {
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

	@Column('varchar', {
		length: 2048,
	})
	public keyPem: string;
}
