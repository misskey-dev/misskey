/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// https://github.com/typeorm/typeorm/issues/2400
import pg from 'pg';
pg.types.setTypeParser(20, Number);

import { DataSource, Logger, QueryRunner } from 'typeorm';
import { QueryResultCache } from 'typeorm/cache/QueryResultCache.js';
import { QueryResultCacheOptions } from 'typeorm/cache/QueryResultCacheOptions.js';
import * as highlight from 'cli-highlight';
import { entities as charts } from '@/core/chart/entities.js';

import { MiAbuseReportResolver } from '@/models/AbuseReportResolver.js';
import { MiAbuseUserReport } from '@/models/AbuseUserReport.js';
import { MiAccessToken } from '@/models/AccessToken.js';
import { MiAd } from '@/models/Ad.js';
import { MiAnnouncement } from '@/models/Announcement.js';
import { MiAnnouncementRead } from '@/models/AnnouncementRead.js';
import { MiAntenna } from '@/models/Antenna.js';
import { MiApp } from '@/models/App.js';
import { MiAvatarDecoration } from '@/models/AvatarDecoration.js';
import { MiAuthSession } from '@/models/AuthSession.js';
import { MiBlocking } from '@/models/Blocking.js';
import { MiChannelFollowing } from '@/models/ChannelFollowing.js';
import { MiChannelFavorite } from '@/models/ChannelFavorite.js';
import { MiClip } from '@/models/Clip.js';
import { MiClipNote } from '@/models/ClipNote.js';
import { MiClipFavorite } from '@/models/ClipFavorite.js';
import { MiDriveFile } from '@/models/DriveFile.js';
import { MiDriveFolder } from '@/models/DriveFolder.js';
import { MiEmoji } from '@/models/Emoji.js';
import { MiFollowing } from '@/models/Following.js';
import { MiFollowRequest } from '@/models/FollowRequest.js';
import { MiGalleryLike } from '@/models/GalleryLike.js';
import { MiGalleryPost } from '@/models/GalleryPost.js';
import { MiHashtag } from '@/models/Hashtag.js';
import { MiInstance } from '@/models/Instance.js';
import { MiMeta } from '@/models/Meta.js';
import { MiModerationLog } from '@/models/ModerationLog.js';
import { MiMuting } from '@/models/Muting.js';
import { MiRenoteMuting } from '@/models/RenoteMuting.js';
import { MiNote } from '@/models/Note.js';
import { MiNoteFavorite } from '@/models/NoteFavorite.js';
import { MiNoteReaction } from '@/models/NoteReaction.js';
import { MiNoteThreadMuting } from '@/models/NoteThreadMuting.js';
import { MiNoteUnread } from '@/models/NoteUnread.js';
import { MiPage } from '@/models/Page.js';
import { MiPageLike } from '@/models/PageLike.js';
import { MiPasswordResetRequest } from '@/models/PasswordResetRequest.js';
import { MiPoll } from '@/models/Poll.js';
import { MiPollVote } from '@/models/PollVote.js';
import { MiPromoNote } from '@/models/PromoNote.js';
import { MiPromoRead } from '@/models/PromoRead.js';
import { MiRegistrationTicket } from '@/models/RegistrationTicket.js';
import { MiRegistryItem } from '@/models/RegistryItem.js';
import { MiRelay } from '@/models/Relay.js';
import { MiSignin } from '@/models/Signin.js';
import { MiSwSubscription } from '@/models/SwSubscription.js';
import { MiUsedUsername } from '@/models/UsedUsername.js';
import { MiUser } from '@/models/User.js';
import { MiUserIp } from '@/models/UserIp.js';
import { MiUserKeypair } from '@/models/UserKeypair.js';
import { MiUserList } from '@/models/UserList.js';
import { MiUserListFavorite } from '@/models/UserListFavorite.js';
import { MiUserListMembership } from '@/models/UserListMembership.js';
import { MiUserNotePining } from '@/models/UserNotePining.js';
import { MiUserPending } from '@/models/UserPending.js';
import { MiUserProfile } from '@/models/UserProfile.js';
import { MiUserPublickey } from '@/models/UserPublickey.js';
import { MiUserSecurityKey } from '@/models/UserSecurityKey.js';
import { MiWebhook } from '@/models/Webhook.js';
import { MiChannel } from '@/models/Channel.js';
import { MiRetentionAggregation } from '@/models/RetentionAggregation.js';
import { MiRole } from '@/models/Role.js';
import { MiRoleAssignment } from '@/models/RoleAssignment.js';
import { MiFlash } from '@/models/Flash.js';
import { MiFlashLike } from '@/models/FlashLike.js';
import { MiUserMemo } from '@/models/UserMemo.js';
import { MiBubbleGameRecord } from '@/models/BubbleGameRecord.js';
import { MiReversiGame } from '@/models/ReversiGame.js';

import { Config } from '@/config.js';
import { bindThis } from '@/decorators.js';
import MisskeyLogger from '@/logger.js';
import { envOption } from './env.js';

export const dbLogger = new MisskeyLogger('db');

const sqlLogger = dbLogger.createSubLogger('sql', 'gray', false);

class MyCustomLogger implements Logger {
	@bindThis
	private highlight(sql: string) {
		if (envOption.logJson) return sql;

		return highlight.highlight(sql, {
			language: 'sql', ignoreIllegals: true,
		});
	}

	@bindThis
	public logQuery(query: string, parameters?: any[]) {
		sqlLogger.info(this.highlight(query));
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
	MiAbuseReportResolver,
	MiAnnouncement,
	MiAnnouncementRead,
	MiMeta,
	MiInstance,
	MiApp,
	MiAvatarDecoration,
	MiAuthSession,
	MiAccessToken,
	MiUser,
	MiUserProfile,
	MiUserKeypair,
	MiUserPublickey,
	MiUserList,
	MiUserListFavorite,
	MiUserListMembership,
	MiUserNotePining,
	MiUserSecurityKey,
	MiUsedUsername,
	MiFollowing,
	MiFollowRequest,
	MiMuting,
	MiRenoteMuting,
	MiBlocking,
	MiNote,
	MiNoteFavorite,
	MiNoteReaction,
	MiNoteThreadMuting,
	MiNoteUnread,
	MiPage,
	MiPageLike,
	MiGalleryPost,
	MiGalleryLike,
	MiDriveFile,
	MiDriveFolder,
	MiPoll,
	MiPollVote,
	MiEmoji,
	MiHashtag,
	MiSwSubscription,
	MiAbuseUserReport,
	MiRegistrationTicket,
	MiSignin,
	MiModerationLog,
	MiClip,
	MiClipNote,
	MiClipFavorite,
	MiAntenna,
	MiPromoNote,
	MiPromoRead,
	MiRelay,
	MiChannel,
	MiChannelFollowing,
	MiChannelFavorite,
	MiRegistryItem,
	MiAd,
	MiPasswordResetRequest,
	MiUserPending,
	MiWebhook,
	MiUserIp,
	MiRetentionAggregation,
	MiRole,
	MiRoleAssignment,
	MiFlash,
	MiFlashLike,
	MiUserMemo,
	MiBubbleGameRecord,
	MiReversiGame,
	...charts,
];

const log = process.env.NODE_ENV !== 'production';
const timeoutFinalizationRegistry = new FinalizationRegistry((reference: { name: string; timeout: NodeJS.Timeout }) => {
	dbLogger.info(`Finalizing timeout: ${reference.name}`);
	clearInterval(reference.timeout);
});

class InMemoryQueryResultCache implements QueryResultCache {
	private cache: Map<string, QueryResultCacheOptions>;

	constructor(
		private dataSource: DataSource,
	) {
		this.cache = new Map();

		const gcIntervalHandle = setInterval(() => {
			this.gc();
		}, 1000 * 60 * 3);

		timeoutFinalizationRegistry.register(this, { name: typeof this, timeout: gcIntervalHandle });
	}

	connect(): Promise<void> {
		return Promise.resolve(undefined);
	}

	disconnect(): Promise<void> {
		return Promise.resolve(undefined);
	}

	synchronize(queryRunner: QueryRunner): Promise<void> {
		return Promise.resolve(undefined);
	}

	async clear(queryRunner?: QueryRunner): Promise<void> {
		return new Promise<void>((ok) => {
			this.cache.clear();
			ok();
		});
	}

	storeInCache(
		options: QueryResultCacheOptions,
		savedCache: QueryResultCacheOptions | undefined,
		queryRunner?: QueryRunner,
	): Promise<void> {
		return new Promise<void>((ok, fail) => {
			if (options.identifier) {
				this.cache.set(options.identifier, options);
				ok();
			} else if (options.query) {
				this.cache.set(options.query, options);
				ok();
			}
			fail(new Error('No identifier or query'));
		});
	}

	getFromCache(
		options: QueryResultCacheOptions,
		queryRunner?: QueryRunner,
	): Promise<QueryResultCacheOptions | undefined> {
		return new Promise<QueryResultCacheOptions | undefined>((ok) => {
			if (options.identifier) {
				ok(this.cache.get(options.identifier));
			} else if (options.query) {
				ok(this.cache.get(options.query));
			} else {
				ok(undefined);
			}
		});
	}

	isExpired(savedCache: QueryResultCacheOptions): boolean {
		return (savedCache.time ?? 0) + savedCache.duration < Date.now();
	}

	remove(identifiers: string[], queryRunner?: QueryRunner): Promise<void> {
		return new Promise<void>((ok) => {
			for (const identifier of identifiers) {
				this.cache.delete(identifier);
			}
			ok();
		});
	}

	gc(): void {
		const now = Date.now();
		for (const [key, { time, duration }] of this.cache.entries()) {
			if ((time ?? 0) + duration < now) {
				this.cache.delete(key);
			}
		}
	}
}

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
		...(config.dbReplications ? {
			replication: {
				master: {
					host: config.db.host,
					port: config.db.port,
					username: config.db.user,
					password: config.db.pass,
					database: config.db.db,
				},
				slaves: config.dbSlaves!.map(rep => ({
					host: rep.host,
					port: rep.port,
					username: rep.user,
					password: rep.pass,
					database: rep.db,
				})),
			},
		} : {}),
		synchronize: process.env.NODE_ENV === 'test',
		dropSchema: process.env.NODE_ENV === 'test',
		cache: !config.db.disableCache && process.env.NODE_ENV !== 'test' ? {
			provider(dataSource) {
				return new InMemoryQueryResultCache(dataSource);
			},
		} : false,
		logging: log,
		logger: log ? new MyCustomLogger() : undefined,
		maxQueryExecutionTime: 10000, // 10s
		entities: entities,
		migrations: ['../../migration/*.js'],
	});
}
