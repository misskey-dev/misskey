/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, Index, OneToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { obsoleteNotificationTypes, followingVisibilities, followersVisibilities, notificationTypes } from '@/types.js';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiPage } from './Page.js';
import { MiUserList } from './UserList.js';

// TODO: このテーブルで管理している情報すべてレジストリで管理するようにしても良いかも
//       ただ、「emailVerified が true なユーザーを find する」のようなクエリは書けなくなるからウーン
@Entity('user_profile')
export class MiUserProfile {
	@PrimaryColumn(id())
	public userId: MiUser['id'];

	@OneToOne(() => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Column('varchar', {
		length: 128, nullable: true,
		comment: 'The location of the User.',
	})
	public location: string | null;

	// Note: There's index named IDX_de22cd2b445eee31ae51cdbe99 for SUBSTR("birthday", 6, 5)
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

	// フォローされた際のメッセージ
	@Column('varchar', {
		length: 256, nullable: true,
	})
	public followedMessage: string | null;

	// TODO: 鍵アカウントの場合の、フォローリクエスト受信時のメッセージも設定できるようにする

	@Column('jsonb', {
		default: [],
	})
	public fields: {
		name: string;
		value: string;
	}[];

	@Column('varchar', {
		array: true,
		default: '{}',
	})
	public verifiedLinks: string[];

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
		default: true,
	})
	public publicReactions: boolean;

	@Column('enum', {
		enum: followingVisibilities,
		default: 'public',
	})
	public followingVisibility: typeof followingVisibilities[number];

	@Column('enum', {
		enum: followersVisibilities,
		default: 'public',
	})
	public followersVisibility: typeof followersVisibilities[number];

	@Column('varchar', {
		length: 128, nullable: true,
	})
	public twoFactorTempSecret: string | null;

	@Column('varchar', {
		length: 128, nullable: true,
	})
	public twoFactorSecret: string | null;

	@Column('varchar', {
		nullable: true, array: true,
	})
	public twoFactorBackupSecret: string[] | null;

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
		default: true,
	})
	public preventAiLearning: boolean;

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
	public pinnedPageId: MiPage['id'] | null;

	@OneToOne(() => MiPage, {
		onDelete: 'SET NULL',
	})
	@JoinColumn()
	public pinnedPage: MiPage | null;

	@Index()
	@Column('boolean', {
		default: false, select: false,
	})
	public enableWordMute: boolean;

	@Column('jsonb', {
		default: [],
	})
	public mutedWords: (string[] | string)[];

	@Column('jsonb', {
		default: [],
	})
	public hardMutedWords: (string[] | string)[];

	@Column('jsonb', {
		default: [],
		comment: 'List of instances muted by the user.',
	})
	public mutedInstances: string[];

	@Column('jsonb', {
		default: {},
	})
	public notificationRecieveConfig: {
		[notificationType in typeof notificationTypes[number]]?: {
			type: 'all';
		} | {
			type: 'never';
		} | {
			type: 'following';
		} | {
			type: 'follower';
		} | {
			type: 'mutualFollow';
		} | {
			type: 'followingOrFollower';
		} | {
			type: 'list';
			userListId: MiUserList['id'];
		};
	};

	@Column('varchar', {
		length: 32, array: true, default: '{}',
	})
	public loggedInDates: string[];

	@Column('jsonb', {
		default: [],
	})
	public achievements: {
		name: typeof ACHIEVEMENT_TYPES[number];
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

	constructor(data: Partial<MiUserProfile>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}

export const ACHIEVEMENT_TYPES = [
	'notes1',
	'notes10',
	'notes100',
	'notes500',
	'notes1000',
	'notes5000',
	'notes10000',
	'notes20000',
	'notes30000',
	'notes40000',
	'notes50000',
	'notes60000',
	'notes70000',
	'notes80000',
	'notes90000',
	'notes100000',
	'login3',
	'login7',
	'login15',
	'login30',
	'login60',
	'login100',
	'login200',
	'login300',
	'login400',
	'login500',
	'login600',
	'login700',
	'login800',
	'login900',
	'login1000',
	'passedSinceAccountCreated1',
	'passedSinceAccountCreated2',
	'passedSinceAccountCreated3',
	'loggedInOnBirthday',
	'loggedInOnNewYearsDay',
	'noteClipped1',
	'noteFavorited1',
	'myNoteFavorited1',
	'profileFilled',
	'markedAsCat',
	'following1',
	'following10',
	'following50',
	'following100',
	'following300',
	'followers1',
	'followers10',
	'followers50',
	'followers100',
	'followers300',
	'followers500',
	'followers1000',
	'collectAchievements30',
	'viewAchievements3min',
	'iLoveMisskey',
	'foundTreasure',
	'client30min',
	'client60min',
	'noteDeletedWithin1min',
	'postedAtLateNight',
	'postedAt0min0sec',
	'selfQuote',
	'htl20npm',
	'viewInstanceChart',
	'outputHelloWorldOnScratchpad',
	'open3windows',
	'driveFolderCircularReference',
	'reactWithoutRead',
	'clickedClickHere',
	'justPlainLucky',
	'setNameToSyuilo',
	'cookieClicked',
	'brainDiver',
	'smashTestNotificationButton',
	'tutorialCompleted',
	'bubbleGameExplodingHead',
	'bubbleGameDoubleExplodingHead',
] as const;
