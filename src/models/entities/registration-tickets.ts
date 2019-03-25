import { PrimaryColumn, Entity, Index, Column } from 'typeorm';

@Entity()
export class RegistrationTicket {
	@PrimaryColumn('char', { length: 26 })
	public id: string;

	@Column('date')
	public createdAt: Date;

	@Index({ unique: true })
	@Column('varchar', {
		length: 64,
	})
	public code: string;
}
