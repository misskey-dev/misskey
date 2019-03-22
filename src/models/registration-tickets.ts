import { PrimaryGeneratedColumn, Entity, Index, Column } from 'typeorm';

@Entity()
export class RegistrationTicket {
	@PrimaryGeneratedColumn()
	public id: number;

	@Column('date')
	public createdAt: Date;

	@Index({ unique: true })
	@Column('varchar', {
		length: 64,
	})
	public code: string;
}
