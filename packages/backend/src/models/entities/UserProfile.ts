import { Entity, Column, Index, OneToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { obsoleteNotificationTypes, ffVisibility, notificationTypes } from '@/types.js';
import { id } from '../id.js';
import { User } from './User.js';
import { Page } from './Page.js';

// TODO: このテーブルで管理している情報すべてレジストリで管理するようにしても良いかも
//       ただ、「emailVerified が true なユーザーを find する」のようなクエリは書けなくなるからウーン
@Entity()
export class UserProfile {
	@PrimaryColumn(id())
	public userId: User['id'];

	@OneToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: User | null;

	@Column('varchar', {
		length: 128, nullable: true,
		comment: 'The location of the User.',
	})
	public location: string | null;

	@Column('char', {
		length: 10, nullable: true,
		comment: 'The birthday (YYYY-MM-DD) of the User.',
	})
	public birthday: string | null;

	@Column('varchar', {
		length: 2048, nullable: true,
		comment: 'The description (bio) of the User.',
	})
	public description: string | null;

	@Column('jsonb', {
		default: [],
	})
	public fields: {
		name: string;
		value: string;
	}[];

	@Column('varchar', {
		length: 32, nullable: true,
	})
	public lang: string | null;

	@Column('varchar', {
		length: 512, nullable: true,
		comment: 'Remote URL of the user.',
	})
	public url: string | null;

	@Column('varchar', {
		length: 128, nullable: true,
		comment: 'The email address of the User.',
	})
	public email: string | null;

	@Column('varchar', {
		length: 128, nullable: true,
	})
	public emailVerifyCode: string | null;

	@Column('boolean', {
		default: false,
	})
	public emailVerified: boolean;

	@Column('jsonb', {
		default: ['follow', 'receiveFollowRequest'],
	})
	public emailNotificationTypes: string[];

	@Column('boolean', {
		default: false,
	})
	public publicReactions: boolean;

	@Column('enum', {
		enum: ffVisibility,
		default: 'public',
	})
	public ffVisibility: typeof ffVisibility[number];

	@Column('varchar', {
		length: 128, nullable: true,
	})
	public twoFactorTempSecret: string | null;

	@Column('varchar', {
		length: 128, nullable: true,
	})
	public twoFactorSecret: string | null;

	@Column('boolean', {
		default: false,
	})
	public twoFactorEnabled: boolean;

	@Column('boolean', {
		default: false,
	})
	public securityKeysAvailable: boolean;

	@Column('boolean', {
		default: false,
	})
	public usePasswordLessLogin: boolean;

	@Column('varchar', {
		length: 128, nullable: true,
		comment: 'The password hash of the User. It will be null if the origin of the user is local.',
	})
	public password: string | null;

	@Column('varchar', {
		length: 8192, default: '',
	})
	public moderationNote: string | null;

	// TODO: そのうち消す
	@Column('jsonb', {
		default: {},
		comment: 'The client-specific data of the User.',
	})
	public clientData: Record<string, any>;

	// TODO: そのうち消す
	@Column('jsonb', {
		default: {},
		comment: 'The room data of the User.',
	})
	public room: Record<string, any>;

	@Column('boolean', {
		default: false,
	})
	public autoAcceptFollowed: boolean;

	@Column('boolean', {
		default: false,
		comment: 'Whether reject index by crawler.',
	})
	public noCrawle: boolean;

	@Column('boolean', {
		default: false,
	})
	public alwaysMarkNsfw: boolean;

	@Column('boolean', {
		default: false,
	})
	public autoSensitive: boolean;

	@Column('boolean', {
		default: false,
	})
	public carefulBot: boolean;

	@Column('boolean', {
		default: true,
	})
	public injectFeaturedNote: boolean;

	@Column('boolean', {
		default: true,
	})
	public receiveAnnouncementEmail: boolean;

	@Column({
		...id(),
		nullable: true,
	})
	public pinnedPageId: Page['id'] | null;

	@OneToOne(type => Page, {
		onDelete: 'SET NULL',
	})
	@JoinColumn()
	public pinnedPage: Page | null;

	@Index()
	@Column('boolean', {
		default: false, select: false,
	})
	public enableWordMute: boolean;

	@Column('jsonb', {
		default: [],
	})
	public mutedWords: string[][];

	@Column('jsonb', {
		default: [],
		comment: 'List of instances muted by the user.',
	})
	public mutedInstances: string[];

	@Column('enum', {
		enum: [ 
			...notificationTypes,
			// マイグレーションで削除が困難なので古いenumは残しておく
			...obsoleteNotificationTypes,
		],
		array: true,
		default: [],
	})
	public mutingNotificationTypes: typeof notificationTypes[number][];

	@Column('varchar', {
		length: 32, array: true, default: '{}',
	})
	public loggedInDates: string[];

	@Column('jsonb', {
		default: [],
	})
	public achievements: {
		name: string;
		unlockedAt: number;
	}[];

	//#region Denormalized fields
	@Index()
	@Column('varchar', {
		length: 128, nullable: true,
		comment: '[Denormalized]',
	})
	public userHost: string | null;
	//#endregion

	constructor(data: Partial<UserProfile>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
