import { Entity, PrimaryGeneratedColumn, Index, Column } from 'typeorm';

@Entity()
export class Log {
	@PrimaryGeneratedColumn()
	public id: number;

	@Index()
	@Column({
		type: 'date',
		comment: 'The created date of the Log.'
	})
	public createdAt: Date;

	@Index()
	@Column({
		type: 'simple-array',
	})
	public domain: string[];

	@Index()
	@Column({
		type: 'enum',
		enum: ['error', 'warning', 'info', 'success', 'debug']
	})
	public level: string;

	@Column({
		type: 'varchar', length: 8
	})
	public worker: string;

	@Column({
		type: 'varchar', length: 128
	})
	public machine: string;

	@Column({
		type: 'varchar', length: 1024
	})
	public message: string;

	@Column({
		type: 'jsonb', default: {}
	})
	public data: Record<string, any>;
}
