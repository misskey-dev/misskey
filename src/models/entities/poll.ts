import { PrimaryColumn, Entity, Index, JoinColumn, Column, OneToOne } from 'typeorm';
import { id } from '../id';
import { Note } from './note';

@Entity({
	orderBy: {
		id: 'DESC'
	}
})
export class Poll {
	@PrimaryColumn(id())
	public id: string;

	@Index({ unique: true })
	@Column(id())
	public noteId: Note['id'];

	@OneToOne(type => Note, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public note: Note | null;

	@Column('timestamp with time zone', {
		nullable: true
	})
	public expiresAt: Date | null;

	@Column('boolean')
	public multiple: boolean;

	@Column('varchar', {
		length: 128, array: true, default: '{}'
	})
	public choices: string[];

	@Column('integer', {
		array: true,
	})
	public votes: number[];

	//#region Denormalized fields
	@Index()
	@Column('varchar', {
		length: 128, nullable: true,
		comment: '[Denormalized]'
	})
	public userHost: string | null;
	//#endregion
}

export type IPoll = {
	choices: string[];
	votes?: number[];
	multiple: boolean;
	expiresAt: Date;
};
