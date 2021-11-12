import { Entity, Index, JoinColumn, Column, PrimaryColumn, ManyToOne } from 'typeorm';
import { User } from './user';
import { id } from '../id';
import { DriveFile } from './drive-file';

@Entity()
export class GalleryPost {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the GalleryPost.'
	})
	public createdAt: Date;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The updated date of the GalleryPost.'
	})
	public updatedAt: Date;

	@Column('varchar', {
		length: 256,
	})
	public title: string;

	@Column('varchar', {
		length: 2048, nullable: true
	})
	public description: string | null;

	@Index()
	@Column({
		...id(),
		comment: 'The ID of author.'
	})
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public user: User | null;

	@Index()
	@Column({
		...id(),
		array: true, default: '{}'
	})
	public fileIds: DriveFile['id'][];

	@Index()
	@Column('boolean', {
		default: false,
		comment: 'Whether the post is sensitive.'
	})
	public isSensitive: boolean;

	@Index()
	@Column('integer', {
		default: 0
	})
	public likedCount: number;

	@Index()
	@Column('varchar', {
		length: 128, array: true, default: '{}'
	})
	public tags: string[];

	constructor(data: Partial<GalleryPost>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
