import { Entity, Index, JoinColumn, Column, ManyToOne, PrimaryColumn } from 'typeorm';
import { id } from '../id.js';
import { Note } from './Note.js';
import { Clip } from './Clip.js';

@Entity()
@Index(['noteId', 'clipId'], { unique: true })
export class ClipNote {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		comment: 'The note ID.',
	})
	public noteId: Note['id'];

	@ManyToOne(type => Note, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public note: Note | null;

	@Index()
	@Column({
		...id(),
		comment: 'The clip ID.',
	})
	public clipId: Clip['id'];

	@ManyToOne(type => Clip, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public clip: Clip | null;
}
