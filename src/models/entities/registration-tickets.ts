import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { id } from '../id';

@Entity()
export class RegistrationTicket {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone')
	public createdAt: Date;

	@Index({ unique: true })
	@Column('varchar', {
		length: 64,
	})
	public code: string;
}
