import { Entity, Index, Column, PrimaryColumn } from 'typeorm';
import { id } from '../id.js';

@Entity()
export class Ad {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the Ad.',
	})
	public createdAt: Date;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The expired date of the Ad.',
	})
	public expiresAt: Date;

	@Column('varchar', {
		length: 32, nullable: false,
	})
	public place: string;

	// 今は使われていないが将来的に活用される可能性はある
	@Column('varchar', {
		length: 32, nullable: false,
	})
	public priority: string;

	@Column('integer', {
		default: 1, nullable: false,
	})
	public ratio: number;

	@Column('varchar', {
		length: 1024, nullable: false,
	})
	public url: string;

	@Column('varchar', {
		length: 1024, nullable: false,
	})
	public imageUrl: string;

	@Column('varchar', {
		length: 8192, nullable: false,
	})
	public memo: string;

	constructor(data: Partial<Ad>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
