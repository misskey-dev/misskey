import { Entity, PrimaryColumn, Index, Column } from 'typeorm';
import { id } from '../id.js';
import type { User } from './User.js';

@Entity()
export class RetentionAggregation {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the Note.',
	})
	public createdAt: Date;

	@Column('timestamp with time zone', {
		comment: 'The updated date of the GalleryPost.',
	})
	public updatedAt: Date;

	@Column({
		...id(),
		array: true,
	})
	public userIds: User['id'][];

	@Column('integer', {
	})
	public usersCount: number;

	@Column('jsonb', {
		default: {},
	})
	public data: Record<string, number>;
}
