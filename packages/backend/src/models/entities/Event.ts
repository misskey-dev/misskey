import { Entity, Index, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { id } from '../id.js';
import { Note } from './Note.js';

@Entity()
export class Event {
	@PrimaryColumn(id())
	public noteId: Note['id'];

	@OneToOne(type => Note, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public note: Note | null;

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
