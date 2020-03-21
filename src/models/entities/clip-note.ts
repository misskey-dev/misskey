import { Entity, Index, JoinColumn, Column, ManyToOne, PrimaryColumn } from 'typeorm';
import { Note } from './note';
import { Clip } from './clip';
import { id } from '../id';

@Entity()
@Index(['noteId', 'clipId'], { unique: true })
export class ClipNote {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		comment: 'The note ID.'
	})
	public noteId: Note['id'];

	@ManyToOne(type => Note, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public note: Note | null;

	@Index()
	@Column({
		...id(),
		comment: 'The clip ID.'
	})
	public clipId: Clip['id'];

	@ManyToOne(type => Clip, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public clip: Clip | null;
}
