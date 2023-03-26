// https://github.com/typeorm/typeorm/issues/2400
import pg from 'pg';
pg.types.setTypeParser(20, Number);

import { DataSource, Logger } from 'typeorm';
import * as highlight from 'cli-highlight';
import { entities as charts } from '@/core/chart/entities.js';

import { AbuseUserReport } from '@/models/entities/AbuseUserReport.js';
import { AccessToken } from '@/models/entities/AccessToken.js';
import { Ad } from '@/models/entities/Ad.js';
import { Announcement } from '@/models/entities/Announcement.js';
import { AnnouncementRead } from '@/models/entities/AnnouncementRead.js';
import { Antenna } from '@/models/entities/Antenna.js';
import { AntennaNote } from '@/models/entities/AntennaNote.js';
import { App } from '@/models/entities/App.js';
import { AttestationChallenge } from '@/models/entities/AttestationChallenge.js';
import { AuthSession } from '@/models/entities/AuthSession.js';
import { Blocking } from '@/models/entities/Blocking.js';
import { ChannelFollowing } from '@/models/entities/ChannelFollowing.js';
import { ChannelNotePining } from '@/models/entities/ChannelNotePining.js';
import { Clip } from '@/models/entities/Clip.js';
import { ClipNote } from '@/models/entities/ClipNote.js';
import { ClipFavorite } from '@/models/entities/ClipFavorite.js';
import { DriveFile } from '@/models/entities/DriveFile.js';
import { DriveFolder } from '@/models/entities/DriveFolder.js';
import { Emoji } from '@/models/entities/Emoji.js';
import { Following } from '@/models/entities/Following.js';
import { FollowRequest } from '@/models/entities/FollowRequest.js';
import { GalleryLike } from '@/models/entities/GalleryLike.js';
import { GalleryPost } from '@/models/entities/GalleryPost.js';
import { Hashtag } from '@/models/entities/Hashtag.js';
import { Instance } from '@/models/entities/Instance.js';
import { Meta } from '@/models/entities/Meta.js';
import { ModerationLog } from '@/models/entities/ModerationLog.js';
import { MutedNote } from '@/models/entities/MutedNote.js';
import { Muting } from '@/models/entities/Muting.js';
import { RenoteMuting } from '@/models/entities/RenoteMuting.js';
import { Note } from '@/models/entities/Note.js';
import { NoteFavorite } from '@/models/entities/NoteFavorite.js';
import { NoteReaction } from '@/models/entities/NoteReaction.js';
import { NoteThreadMuting } from '@/models/entities/NoteThreadMuting.js';
import { NoteUnread } from '@/models/entities/NoteUnread.js';
import { Notification } from '@/models/entities/Notification.js';
import { Page } from '@/models/entities/Page.js';
import { PageLike } from '@/models/entities/PageLike.js';
import { PasswordResetRequest } from '@/models/entities/PasswordResetRequest.js';
import { Poll } from '@/models/entities/Poll.js';
import { PollVote } from '@/models/entities/PollVote.js';
import { PromoNote } from '@/models/entities/PromoNote.js';
import { PromoRead } from '@/models/entities/PromoRead.js';
import { RegistrationTicket } from '@/models/entities/RegistrationTicket.js';
import { RegistryItem } from '@/models/entities/RegistryItem.js';
import { Relay } from '@/models/entities/Relay.js';
import { Signin } from '@/models/entities/Signin.js';
import { SwSubscription } from '@/models/entities/SwSubscription.js';
import { UsedUsername } from '@/models/entities/UsedUsername.js';
import { User } from '@/models/entities/User.js';
import { UserIp } from '@/models/entities/UserIp.js';
import { UserKeypair } from '@/models/entities/UserKeypair.js';
import { UserList } from '@/models/entities/UserList.js';
import { UserListJoining } from '@/models/entities/UserListJoining.js';
import { UserNotePining } from '@/models/entities/UserNotePining.js';
import { UserPending } from '@/models/entities/UserPending.js';
import { UserProfile } from '@/models/entities/UserProfile.js';
import { UserPublickey } from '@/models/entities/UserPublickey.js';
import { UserSecurityKey } from '@/models/entities/UserSecurityKey.js';
import { Webhook } from '@/models/entities/Webhook.js';
import { Channel } from '@/models/entities/Channel.js';
import { RetentionAggregation } from '@/models/entities/RetentionAggregation.js';
import { Role } from '@/models/entities/Role.js';
import { RoleAssignment } from '@/models/entities/RoleAssignment.js';
import { Flash } from '@/models/entities/Flash.js';
import { FlashLike } from '@/models/entities/FlashLike.js';

import { Config } from '@/config.js';
import MisskeyLogger from '@/logger.js';
import { bindThis } from '@/decorators.js';

export const dbLogger = new MisskeyLogger('db');

const sqlLogger = dbLogger.createSubLogger('sql', 'gray', false);

class MyCustomLogger implements Logger {
	@bindThis
	private highlight(sql: string) {
		return highlight.highlight(sql, {
			language: 'sql', ignoreIllegals: true,
		});
	}

	@bindThis
	public logQuery(query: string, parameters?: any[]) {
		sqlLogger.info(this.highlight(query).substring(0, 100));
	}

	@bindThis
	public logQueryError(error: string, query: string, parameters?: any[]) {
		sqlLogger.error(this.highlight(query));
	}

	@bindThis
	public logQuerySlow(time: number, query: string, parameters?: any[]) {
		sqlLogger.warn(this.highlight(query));
	}

	@bindThis
	public logSchemaBuild(message: string) {
		sqlLogger.info(message);
	}

	@bindThis
	public log(message: string) {
		sqlLogger.info(message);
	}

	@bindThis
	public logMigration(message: string) {
		sqlLogger.info(message);
	}
}

export const entities = [
	Announcement,
	AnnouncementRead,
	Meta,
	Instance,
	App,
	AuthSession,
	AccessToken,
	User,
	UserProfile,
	UserKeypair,
	UserPublickey,
	UserList,
	UserListJoining,
	UserNotePining,
	UserSecurityKey,
	UsedUsername,
	AttestationChallenge,
	Following,
	FollowRequest,
	Muting,
	RenoteMuting,
	Blocking,
	Note,
	NoteFavorite,
	NoteReaction,
	NoteThreadMuting,
	NoteUnread,
	Page,
	PageLike,
	GalleryPost,
	GalleryLike,
	DriveFile,
	DriveFolder,
	Poll,
	PollVote,
	Notification,
	Emoji,
	Hashtag,
	SwSubscription,
	AbuseUserReport,
	RegistrationTicket,
	Signin,
	ModerationLog,
	Clip,
	ClipNote,
	ClipFavorite,
	Antenna,
	AntennaNote,
	PromoNote,
	PromoRead,
	Relay,
	MutedNote,
	Channel,
	ChannelFollowing,
	ChannelNotePining,
	RegistryItem,
	Ad,
	PasswordResetRequest,
	UserPending,
	Webhook,
	UserIp,
	RetentionAggregation,
	Role,
	RoleAssignment,
	Flash,
	FlashLike,
	...charts,
];

const log = process.env.NODE_ENV !== 'production';

export function createPostgresDataSource(config: Config) {
	return new DataSource({
		type: 'postgres',
		host: config.db.host,
		port: config.db.port,
		username: config.db.user,
		password: config.db.pass,
		database: config.db.db,
		extra: {
			statement_timeout: 1000 * 10,
			...config.db.extra,
		},
		synchronize: process.env.NODE_ENV === 'test',
		dropSchema: process.env.NODE_ENV === 'test',
		cache: !config.db.disableCache && process.env.NODE_ENV !== 'test' ? { // dbをcloseしても何故かredisのコネクションが内部的に残り続けるようで、テストの際に支障が出るため無効にする(キャッシュも含めてテストしたいため本当は有効にしたいが...)
			type: 'ioredis',
			options: {
				host: config.redis.host,
				port: config.redis.port,
				family: config.redis.family == null ? 0 : config.redis.family,
				password: config.redis.pass,
				keyPrefix: `${config.redis.prefix}:query:`,
				db: config.redis.db ?? 0,
			},
		} : false,
		logging: log,
		logger: log ? new MyCustomLogger() : undefined,
		maxQueryExecutionTime: 300,
		entities: entities,
		migrations: ['../../migration/*.js'],
	});
}
