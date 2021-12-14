import { Entity, Index, JoinColumn, Column, ManyToOne, PrimaryColumn } from 'typeorm';
import { Note } from './note';
import { Antenna } from './antenna';
import { id } from '../id';

@Entity()
@Index(['noteId', 'antennaId'], { unique: true })
export class AntennaNote {
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
		comment: 'The antenna ID.',
	})
	public antennaId: Antenna['id'];

	@ManyToOne(type => Antenna, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public antenna: Antenna | null;

	@Index()
	@Column('boolean', {
		default: false,
	})
	public read: boolean;
}
