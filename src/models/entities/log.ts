import { Entity, PrimaryColumn, Index, Column } from 'typeorm';
import { id } from '../id';

@Entity()
export class Log {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the Log.'
	})
	public createdAt: Date;

	@Index()
	@Column('varchar', {
		length: 64, array: true, default: '{}'
	})
	public domain: string[];

	@Index()
	@Column('enum', {
		enum: ['error', 'warning', 'info', 'success', 'debug']
	})
	public level: string;

	@Column('varchar', {
		length: 8
	})
	public worker: string;

	@Column('varchar', {
		length: 128
	})
	public machine: string;

	@Column('varchar', {
		length: 2048
	})
	public message: string;

	@Column('jsonb', {
		default: {}
	})
	public data: Record<string, unknown>;
}
