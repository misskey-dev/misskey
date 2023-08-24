/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// https://github.com/typeorm/typeorm/issues/2400
import pg from 'pg';
pg.types.setTypeParser(20, Number);

import { DataSource, Logger } from 'typeorm';
import * as highlight from 'cli-highlight';
import { entities as charts } from '@/core/chart/entities.js';

import { MiAbuseUserReport } from '@/models/entities/AbuseUserReport.js';
import { MiAccessToken } from '@/models/entities/AccessToken.js';
import { MiAd } from '@/models/entities/Ad.js';
import { MiAnnouncement } from '@/models/entities/Announcement.js';
import { MiAnnouncementRead } from '@/models/entities/AnnouncementRead.js';
import { MiAntenna } from '@/models/entities/Antenna.js';
import { MiApp } from '@/models/entities/App.js';
import { MiAttestationChallenge } from '@/models/entities/AttestationChallenge.js';
import { MiAuthSession } from '@/models/entities/AuthSession.js';
import { MiBlocking } from '@/models/entities/Blocking.js';
import { MiChannelFollowing } from '@/models/entities/ChannelFollowing.js';
import { MiChannelFavorite } from '@/models/entities/ChannelFavorite.js';
import { MiClip } from '@/models/entities/Clip.js';
import { MiClipNote } from '@/models/entities/ClipNote.js';
import { MiClipFavorite } from '@/models/entities/ClipFavorite.js';
import { MiDriveFile } from '@/models/entities/DriveFile.js';
import { MiDriveFolder } from '@/models/entities/DriveFolder.js';
import { MiEmoji } from '@/models/entities/Emoji.js';
import { MiFollowing } from '@/models/entities/Following.js';
import { MiFollowRequest } from '@/models/entities/FollowRequest.js';
import { MiGalleryLike } from '@/models/entities/GalleryLike.js';
import { MiGalleryPost } from '@/models/entities/GalleryPost.js';
import { MiHashtag } from '@/models/entities/Hashtag.js';
import { MiInstance } from '@/models/entities/Instance.js';
import { MiMeta } from '@/models/entities/Meta.js';
import { MiModerationLog } from '@/models/entities/ModerationLog.js';
import { MiMutedNote } from '@/models/entities/MutedNote.js';
import { MiMuting } from '@/models/entities/Muting.js';
import { MiRenoteMuting } from '@/models/entities/RenoteMuting.js';
import { MiNote } from '@/models/entities/Note.js';
import { MiNoteFavorite } from '@/models/entities/NoteFavorite.js';
import { MiNoteReaction } from '@/models/entities/NoteReaction.js';
import { MiNoteThreadMuting } from '@/models/entities/NoteThreadMuting.js';
import { MiNoteUnread } from '@/models/entities/NoteUnread.js';
import { MiPage } from '@/models/entities/Page.js';
import { MiPageLike } from '@/models/entities/PageLike.js';
import { MiPasswordResetRequest } from '@/models/entities/PasswordResetRequest.js';
import { MiPoll } from '@/models/entities/Poll.js';
import { MiPollVote } from '@/models/entities/PollVote.js';
import { MiPromoNote } from '@/models/entities/PromoNote.js';
import { MiPromoRead } from '@/models/entities/PromoRead.js';
import { MiRegistrationTicket } from '@/models/entities/RegistrationTicket.js';
import { MiRegistryItem } from '@/models/entities/RegistryItem.js';
import { MiRelay } from '@/models/entities/Relay.js';
import { MiSignin } from '@/models/entities/Signin.js';
import { MiSwSubscription } from '@/models/entities/SwSubscription.js';
import { MiUsedUsername } from '@/models/entities/UsedUsername.js';
import { MiUser } from '@/models/entities/User.js';
import { MiUserIp } from '@/models/entities/UserIp.js';
import { MiUserKeypair } from '@/models/entities/UserKeypair.js';
import { MiUserList } from '@/models/entities/UserList.js';
import { MiUserListFavorite } from '@/models/entities/UserListFavorite.js';
import { MiUserListJoining } from '@/models/entities/UserListJoining.js';
import { MiUserNotePining } from '@/models/entities/UserNotePining.js';
import { MiUserPending } from '@/models/entities/UserPending.js';
import { MiUserProfile } from '@/models/entities/UserProfile.js';
import { MiUserPublickey } from '@/models/entities/UserPublickey.js';
import { MiUserSecurityKey } from '@/models/entities/UserSecurityKey.js';
import { MiWebhook } from '@/models/entities/Webhook.js';
import { MiChannel } from '@/models/entities/Channel.js';
import { MiRetentionAggregation } from '@/models/entities/RetentionAggregation.js';
import { MiRole } from '@/models/entities/Role.js';
import { MiRoleAssignment } from '@/models/entities/RoleAssignment.js';
import { MiFlash } from '@/models/entities/Flash.js';
import { MiFlashLike } from '@/models/entities/FlashLike.js';
import { MiUserMemo } from '@/models/entities/UserMemo.js';

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
	MiAnnouncement,
	MiAnnouncementRead,
	MiMeta,
	MiInstance,
	MiApp,
	MiAuthSession,
	MiAccessToken,
	MiUser,
	MiUserProfile,
	MiUserKeypair,
	MiUserPublickey,
	MiUserList,
	MiUserListFavorite,
	MiUserListJoining,
	MiUserNotePining,
	MiUserSecurityKey,
	MiUsedUsername,
	MiAttestationChallenge,
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
	MiMutedNote,
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
		replication: config.dbReplications ? {
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
		} : undefined,
		synchronize: process.env.NODE_ENV === 'test',
		dropSchema: process.env.NODE_ENV === 'test',
		cache: !config.db.disableCache && process.env.NODE_ENV !== 'test' ? { // dbをcloseしても何故かredisのコネクションが内部的に残り続けるようで、テストの際に支障が出るため無効にする(キャッシュも含めてテストしたいため本当は有効にしたいが...)
			type: 'ioredis',
			options: {
				host: config.redis.host,
				port: config.redis.port,
				family: config.redis.family ?? 0,
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
