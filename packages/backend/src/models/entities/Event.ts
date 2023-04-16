import { Entity, Index, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { id } from '../id.js';
import { noteVisibilities } from '../../types.js';
import { Note } from './Note.js';
import type { User } from './User.js';

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

	//#region Denormalized fields
	@Column('enum', {
		enum: noteVisibilities,
		comment: '[Denormalized]',
	})
	public noteVisibility: typeof noteVisibilities[number];

	@Index()
	@Column({
		...id(),
		comment: '[Denormalized]',
	})
	public userId: User['id'];

	@Index()
	@Column('varchar', {
		length: 128, nullable: true,
		comment: '[Denormalized]',
	})
	public userHost: string | null;
	//#endregion

	constructor(data: Partial<Event>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}

export type IEvent = {
	start: Date;
	end: Date | null
	title: string;
	metadata: Record<string, string>;
}
