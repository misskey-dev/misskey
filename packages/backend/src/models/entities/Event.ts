import { Entity, Index, Column, PrimaryColumn } from 'typeorm';
import { id } from '../id.js';

@Entity()
export class Event {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The start time of the event',
	})
	public start: Date;

	@Column('timestamp with time zone', {
		comment: 'The end of the event',
		nullable: true,
	})
	public end: Date;

	@Column({
		type: 'varchar',
		length: 128,
		comment: 'short name of event',
	})
	public title: string;

	@Column('jsonb', {
		default: {},
		comment: 'metadata mapping for event with more user configurable optional information',
	})
	public metadata: Record<string, string>;
}
