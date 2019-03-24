import { Entity, Column, Index, OneToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { DriveFile } from './drive-file';

@Entity()
@Index(['usernameLower', 'host'], { unique: true })
export class User {
	@PrimaryGeneratedColumn({
		comment: 'The ID of the User.'
	})
	public id: number;

	@Index()
	@Column('date', {
		comment: 'The created date of the User.'
	})
	public createdAt: Date;

	@Index()
	@Column('date', {
		nullable: true,
		comment: 'The updated date of the User.'
	})
	public updatedAt: Date | null;

	@Column('varchar', {
		length: 128,
		comment: 'The username of the User.'
	})
	public username: string;

	@Index()
	@Column('varchar', {
		length: 128,
		comment: 'The username (lowercased) of the User.'
	})
	public usernameLower: string;

	@Column('varchar', {
		length: 128, nullable: true,
		comment: 'The name of the User.'
	})
	public name: string | null;

	@Column('varchar', {
		length: 128, nullable: true,
		comment: 'The location of the User.'
	})
	public location: string | null;

	@Column('char', {
		length: 10, nullable: true,
		comment: 'The birthday (YYYY-MM-DD) of the User.'
	})
	public birthday: string | null;

	@Column('integer', {
		default: 0,
		comment: 'The count of followers.'
	})
	public followersCount: number;

	@Column('integer', {
		default: 0,
		comment: 'The count of following.'
	})
	public followingCount: number;

	@Column('integer', {
		default: 0,
		comment: 'The count of notes.'
	})
	public notesCount: number;

	@Column('integer', {
		nullable: true,
		comment: 'The ID of avatar DriveFile.'
	})
	public avatarId: number | null;

	@OneToOne(type => DriveFile, {
		onDelete: 'SET NULL'
	})
	@JoinColumn()
	public avatar: DriveFile | null;

	@Column('integer', {
		nullable: true,
		comment: 'The ID of banner DriveFile.'
	})
	public bannerId: number | null;

	@OneToOne(type => DriveFile, {
		onDelete: 'SET NULL'
	})
	@JoinColumn()
	public banner: DriveFile | null;

	@Column('varchar', {
		length: 1024, nullable: true,
		comment: 'The description (bio) of the User.'
	})
	public description: string | null;

	@Column('varchar', {
		length: 128, nullable: true,
		comment: 'The email address of the User.'
	})
	public email: string | null;

	@Column('boolean', {
		nullable: false, default: false,
		comment: 'Whether the User has unread notification.'
	})
	public hasUnreadNotification: boolean;

	@Column('boolean', {
		nullable: false, default: false,
		comment: 'Whether the User is suspended.'
	})
	public isSuspended: boolean;

	@Column('boolean', {
		nullable: false, default: false,
		comment: 'Whether the User is silenced.'
	})
	public isSilenced: boolean;

	@Column('boolean', {
		nullable: false, default: false,
		comment: 'Whether the User is locked.'
	})
	public isLocked: boolean;

	@Column('boolean', {
		nullable: false, default: false,
		comment: 'Whether the User is a bot.'
	})
	public isBot: boolean;

	@Column('boolean', {
		nullable: false, default: false,
		comment: 'Whether the User is a cat.'
	})
	public isCat: boolean;

	@Column('boolean', {
		nullable: false, default: false,
		comment: 'Whether the User is the admin.'
	})
	public isAdmin: boolean;

	@Column('boolean', {
		nullable: false, default: false,
		comment: 'Whether the User is a moderator.'
	})
	public isModerator: boolean;

	@Index()
	@Column('varchar', {
		length: 128, nullable: true,
		comment: 'The host of the User. It will be null if the origin of the user is local.'
	})
	public host: string | null;

	@Column('varchar', {
		length: 256, nullable: true,
		comment: 'The inbox of the User. It will be null if the origin of the user is local.'
	})
	public inbox: string | null;

	@Column('varchar', {
		length: 256, nullable: true,
		comment: 'The sharedInbox of the User. It will be null if the origin of the user is local.'
	})
	public sharedInbox: string | null;

	@Index()
	@Column('varchar', {
		length: 256, nullable: true,
		comment: 'The URI of the User. It will be null if the origin of the user is local.'
	})
	public uri: string | null;

	@Column('varchar', {
		length: 128, nullable: true,
		comment: 'The password hash of the User. It will be null if the origin of the user is local.'
	})
	public password: string | null;

	@Index({ unique: true })
	@Column('varchar', {
		length: 32, nullable: true, unique: true,
		comment: 'The native access token of the User. It will be null if the origin of the user is local.'
	})
	public token: string | null;

	@Column('varchar', {
		length: 256, nullable: true,
		comment: 'The keypair of the User. It will be null if the origin of the user is local.'
	})
	public keypair: string | null;

	@Column('jsonb', {
		nullable: false, default: {},
		comment: 'The client-specific data of the User.'
	})
	public clientData: Record<string, any>;

	@Column('jsonb', {
		nullable: false, default: {},
		comment: 'The external service links of the User.'
	})
	public services: Record<string, any>;

	@Column('boolean', {
		nullable: false, default: false,
	})
	public autoWatch: boolean;

	@Column('boolean', {
		nullable: false, default: false,
	})
	public autoAcceptFollowed: boolean;
}

export interface ILocalUser extends User {
	host: null;
}

export interface IRemoteUser extends User {
	host: string;
}
