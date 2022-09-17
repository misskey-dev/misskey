import { PrimaryColumn, Entity, Index, JoinColumn, Column, OneToOne } from 'typeorm';
import { id } from '../id.js';
import { noteVisibilities } from '../../types.js';
import { Note } from './Note.js';
import type { User } from './User.js';

@Entity()
export class Poll {
	@PrimaryColumn(id())
	public noteId: Note['id'];

	@OneToOne(type => Note, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public note: Note | null;

	@Column('timestamp with time zone', {
		nullable: true,
	})
	public expiresAt: Date | null;

	@Column('boolean')
	public multiple: boolean;

	@Column('varchar', {
		length: 128, array: true, default: '{}',
	})
	public choices: string[];

	@Column('integer', {
		array: true,
	})
	public votes: number[];

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

	constructor(data: Partial<Poll>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}

export type IPoll = {
	choices: string[];
	votes?: number[];
	multiple: boolean;
	expiresAt: Date | null;
};
