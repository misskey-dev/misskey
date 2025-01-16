import { Entity, Index, JoinColumn, Column, PrimaryColumn, ManyToOne } from 'typeorm';
import type { NoteCreateOption } from '@/types.js';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('note_scheduled')
@Index(['userId', 'scheduledAt'], { unique: true })
export class MiScheduledNote {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the Note.',
		default: () => 'CURRENT_TIMESTAMP',
	})
	public createdAt: Date;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The scheduled date of the Note.',
		nullable: true
	})
	public scheduledAt: Date | null;

	@Column('varchar', {
		length: 256, nullable: true,
	})
	public reason: string | null;

	@Index()
	@Column({
		...id(),
		comment: 'The ID of author.',
	})
	public userId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Column('jsonb')
	public draft: NoteCreateOption;

	constructor(data: Partial<MiScheduledNote>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
