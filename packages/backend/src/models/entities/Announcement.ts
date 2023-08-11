import { Entity, Index, Column, PrimaryColumn } from 'typeorm';
import { id } from '../id.js';

@Entity()
export class Announcement {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the Announcement.',
	})
	public createdAt: Date;

	@Column('timestamp with time zone', {
		comment: 'The updated date of the Announcement.',
		nullable: true,
	})
	public updatedAt: Date | null;

	@Column('varchar', {
		length: 8192, nullable: false,
	})
	public text: string;

	@Column('varchar', {
		length: 256, nullable: false,
	})
	public title: string;

	@Column('varchar', {
		length: 1024, nullable: true,
	})
	public imageUrl: string | null;

	constructor(data: Partial<Announcement>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
