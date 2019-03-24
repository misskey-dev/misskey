import { PrimaryGeneratedColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user';
import { DriveFolder } from './drive-folder';

@Entity()
export class DriveFile {
	@PrimaryGeneratedColumn()
	public id: number;

	@Index()
	@Column('date', {
		comment: 'The created date of the DriveFile.'
	})
	public createdAt: Date;

	@Index()
	@Column('integer', { nullable: true,
		comment: 'The owner ID.'
	})
	public userId: User['id'] | null;

	@ManyToOne(type => User, {
		onDelete: 'SET NULL'
	})
	@JoinColumn()
	public user: User | null;

	@Index()
	@Column('varchar', {
		length: 128, nullable: true,
		comment: 'The host of owner. It will be null if the user in local.'
	})
	public userHost: string | null;

	@Index()
	@Column('varchar', {
		length: 32,
		comment: 'The MD5 hash of the DriveFile.'
	})
	public md5: string;

	@Column('varchar', {
		length: 256,
		comment: 'The file name of the DriveFile.'
	})
	public name: string;

	@Column('varchar', {
		length: 128,
		comment: 'The contentType (MIME) of the DriveFile.'
	})
	public contentType: string;

	@Column('integer', {
		comment: 'The file size (bytes) of the DriveFile.'
	})
	public size: number;

	@Column('varchar', {
		length: 512, nullable: true,
		comment: 'The comment of the DriveFile.'
	})
	public comment: string | null;

	@Column('jsonb', {
		default: {},
		comment: 'The any properties of the DriveFile. For example, it includes image width/height.'
	})
	public properties: Record<string, any>;

	@Column('boolean')
	public storedInternal: boolean;

	@Column('jsonb', {
		default: {},
		comment: 'The storage information of the DriveFile.'
	})
	public storage: Record<string, any>;

	@Column('varchar', {
		length: 512,
		comment: 'The URL of the DriveFile.'
	})
	public url: string;

	@Column('varchar', {
		length: 512, nullable: true,
		comment: 'The URL of the thumbnail of the DriveFile.'
	})
	public thumbnailUrl: string | null;

	@Column('varchar', {
		length: 512, nullable: true,
		comment: 'The URL of the webpublic of the DriveFile.'
	})
	public webpublicUrl: string | null;

	@Index()
	@Column('varchar', {
		length: 512, nullable: true,
		comment: 'The URI of the DriveFile. it will be null when the DriveFile is local.'
	})
	public uri: string | null;

	@Column('varchar', {
		length: 512,
	})
	public src: string | null;

	@Index()
	@Column('integer', {
		nullable: true,
		comment: 'The parent folder ID. If null, it means the DriveFile is located in root.'
	})
	public folderId: number | null;

	@ManyToOne(type => DriveFolder, {
		onDelete: 'SET NULL'
	})
	@JoinColumn()
	public folder: DriveFolder | null;

	@Column('boolean', {
		default: false,
		comment: 'Whether the DriveFile is NSFW.'
	})
	public isSensitive: boolean;

	/**
	 * 外部の(信頼されていない)URLへの直リンクか否か
	 */
	@Column('boolean', {
		default: false,
		comment: 'Whether the DriveFile is direct link to remote server.'
	})
	public isRemote: boolean;
}
