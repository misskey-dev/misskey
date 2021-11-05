// https://github.com/typeorm/typeorm/issues/2400
const types = require('pg').types;
types.setTypeParser(20, Number);

import { createConnection, Logger, getConnection } from 'typeorm';
import config from '@/config/index';
import { entities as charts } from '@/services/chart/entities';
import { dbLogger } from './logger';
import * as highlight from 'cli-highlight';

import { User } from '@/models/entities/user';
import { DriveFile } from '@/models/entities/drive-file';
import { DriveFolder } from '@/models/entities/drive-folder';
import { AccessToken } from '@/models/entities/access-token';
import { App } from '@/models/entities/app';
import { PollVote } from '@/models/entities/poll-vote';
import { Note } from '@/models/entities/note';
import { NoteReaction } from '@/models/entities/note-reaction';
import { NoteWatching } from '@/models/entities/note-watching';
import { NoteThreadMuting } from '@/models/entities/note-thread-muting';
import { NoteUnread } from '@/models/entities/note-unread';
import { Notification } from '@/models/entities/notification';
import { Meta } from '@/models/entities/meta';
import { Following } from '@/models/entities/following';
import { Instance } from '@/models/entities/instance';
import { Muting } from '@/models/entities/muting';
import { SwSubscription } from '@/models/entities/sw-subscription';
import { Blocking } from '@/models/entities/blocking';
import { UserList } from '@/models/entities/user-list';
import { UserListJoining } from '@/models/entities/user-list-joining';
import { UserGroup } from '@/models/entities/user-group';
import { UserGroupJoining } from '@/models/entities/user-group-joining';
import { UserGroupInvitation } from '@/models/entities/user-group-invitation';
import { Hashtag } from '@/models/entities/hashtag';
import { NoteFavorite } from '@/models/entities/note-favorite';
import { AbuseUserReport } from '@/models/entities/abuse-user-report';
import { RegistrationTicket } from '@/models/entities/registration-tickets';
import { MessagingMessage } from '@/models/entities/messaging-message';
import { Signin } from '@/models/entities/signin';
import { AuthSession } from '@/models/entities/auth-session';
import { FollowRequest } from '@/models/entities/follow-request';
import { Emoji } from '@/models/entities/emoji';
import { ReversiGame } from '@/models/entities/games/reversi/game';
import { ReversiMatching } from '@/models/entities/games/reversi/matching';
import { UserNotePining } from '@/models/entities/user-note-pining';
import { Poll } from '@/models/entities/poll';
import { UserKeypair } from '@/models/entities/user-keypair';
import { UserPublickey } from '@/models/entities/user-publickey';
import { UserProfile } from '@/models/entities/user-profile';
import { UserSecurityKey } from '@/models/entities/user-security-key';
import { AttestationChallenge } from '@/models/entities/attestation-challenge';
import { Page } from '@/models/entities/page';
import { PageLike } from '@/models/entities/page-like';
import { GalleryPost } from '@/models/entities/gallery-post';
import { GalleryLike } from '@/models/entities/gallery-like';
import { ModerationLog } from '@/models/entities/moderation-log';
import { UsedUsername } from '@/models/entities/used-username';
import { Announcement } from '@/models/entities/announcement';
import { AnnouncementRead } from '@/models/entities/announcement-read';
import { Clip } from '@/models/entities/clip';
import { ClipNote } from '@/models/entities/clip-note';
import { Antenna } from '@/models/entities/antenna';
import { AntennaNote } from '@/models/entities/antenna-note';
import { PromoNote } from '@/models/entities/promo-note';
import { PromoRead } from '@/models/entities/promo-read';
import { envOption } from '../env';
import { Relay } from '@/models/entities/relay';
import { MutedNote } from '@/models/entities/muted-note';
import { Channel } from '@/models/entities/channel';
import { ChannelFollowing } from '@/models/entities/channel-following';
import { ChannelNotePining } from '@/models/entities/channel-note-pining';
import { RegistryItem } from '@/models/entities/registry-item';
import { Ad } from '@/models/entities/ad';
import { PasswordResetRequest } from '@/models/entities/password-reset-request';
import { UserPending } from '@/models/entities/user-pending';

const sqlLogger = dbLogger.createSubLogger('sql', 'white', false);

class MyCustomLogger implements Logger {
	private highlight(sql: string) {
		return highlight.highlight(sql, {
			language: 'sql', ignoreIllegals: true,
		});
	}

	public logQuery(query: string, parameters?: any[]) {
		if (envOption.verbose) {
			sqlLogger.info(this.highlight(query));
		}
	}

	public logQueryError(error: string, query: string, parameters?: any[]) {
		sqlLogger.error(this.highlight(query));
	}

	public logQuerySlow(time: number, query: string, parameters?: any[]) {
		sqlLogger.warn(this.highlight(query));
	}

	public logSchemaBuild(message: string) {
		sqlLogger.info(message);
	}

	public log(message: string) {
		sqlLogger.info(message);
	}

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
	UserGroup,
	UserGroupJoining,
	UserGroupInvitation,
	UserNotePining,
	UserSecurityKey,
	UsedUsername,
	AttestationChallenge,
	Following,
	FollowRequest,
	Muting,
	Blocking,
	Note,
	NoteFavorite,
	NoteReaction,
	NoteWatching,
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
	MessagingMessage,
	Signin,
	ModerationLog,
	Clip,
	ClipNote,
	Antenna,
	AntennaNote,
	PromoNote,
	PromoRead,
	ReversiGame,
	ReversiMatching,
	Relay,
	MutedNote,
	Channel,
	ChannelFollowing,
	ChannelNotePining,
	RegistryItem,
	Ad,
	PasswordResetRequest,
	UserPending,
	...charts as any
];

export function initDb(justBorrow = false, sync = false, forceRecreate = false) {
	if (!forceRecreate) {
		try {
			const conn = getConnection();
			return Promise.resolve(conn);
		} catch (e) {}
	}

	const log = process.env.NODE_ENV != 'production';

	return createConnection({
		type: 'postgres',
		host: config.db.host,
		port: config.db.port,
		username: config.db.user,
		password: config.db.pass,
		database: config.db.db,
		extra: config.db.extra,
		synchronize: process.env.NODE_ENV === 'test' || sync,
		dropSchema: process.env.NODE_ENV === 'test' && !justBorrow,
		cache: !config.db.disableCache ? {
			type: 'redis',
			options: {
				host: config.redis.host,
				port: config.redis.port,
				password: config.redis.pass,
				prefix: `${config.redis.prefix}:query:`,
				db: config.redis.db || 0
			}
		} : false,
		logging: log,
		logger: log ? new MyCustomLogger() : undefined,
		entities: entities
	});
}

export async function resetDb() {
	const conn = await getConnection();
	const tables = await conn.query(`SELECT relname AS "table"
	FROM pg_class C LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
	WHERE nspname NOT IN ('pg_catalog', 'information_schema')
		AND C.relkind = 'r'
		AND nspname !~ '^pg_toast';`);
	await Promise.all(tables.map(t => t.table).map(x => conn.query(`DELETE FROM "${x}" CASCADE`)));
}
