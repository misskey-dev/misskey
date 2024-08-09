import { Entity, Column, Index, JoinColumn, PrimaryColumn, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiDriveFile } from './DriveFile.js';

@Entity('user_banner')
export class MiUserBanner {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column(id())
	public userId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Column('varchar', {
		length: 1024,
		nullable: true,
	})
	public description: string | null;
	@Column('varchar', {
		length: 1024,
		nullable: true,
	})
	public url: string | null;

	@Column({
		...id(),
	})
	public fileId: MiDriveFile['id'];

	@ManyToOne(type => MiDriveFile, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public file: MiDriveFile;
}
