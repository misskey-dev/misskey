import { createConnection, Logger, getConnection } from 'typeorm';
import config from '../config';
import { entities as charts } from '../services/chart/entities';
import { dbLogger } from './logger';
import * as highlight from 'cli-highlight';

import { Log } from '../models/entities/log';
import { User } from '../models/entities/user';
import { DriveFile } from '../models/entities/drive-file';
import { DriveFolder } from '../models/entities/drive-folder';
import { AccessToken } from '../models/entities/access-token';
import { App } from '../models/entities/app';
import { PollVote } from '../models/entities/poll-vote';
import { Note } from '../models/entities/note';
import { NoteReaction } from '../models/entities/note-reaction';
import { NoteWatching } from '../models/entities/note-watching';
import { NoteUnread } from '../models/entities/note-unread';
import { Notification } from '../models/entities/notification';
import { Meta } from '../models/entities/meta';
import { Following } from '../models/entities/following';
import { Instance } from '../models/entities/instance';
import { Muting } from '../models/entities/muting';
import { SwSubscription } from '../models/entities/sw-subscription';
import { Blocking } from '../models/entities/blocking';
import { UserList } from '../models/entities/user-list';
import { UserListJoining } from '../models/entities/user-list-joining';
import { UserGroup } from '../models/entities/user-group';
import { UserGroupJoining } from '../models/entities/user-group-joining';
import { UserGroupInvitation } from '../models/entities/user-group-invitation';
import { Hashtag } from '../models/entities/hashtag';
import { NoteFavorite } from '../models/entities/note-favorite';
import { AbuseUserReport } from '../models/entities/abuse-user-report';
import { RegistrationTicket } from '../models/entities/registration-tickets';
import { MessagingMessage } from '../models/entities/messaging-message';
import { Signin } from '../models/entities/signin';
import { AuthSession } from '../models/entities/auth-session';
import { FollowRequest } from '../models/entities/follow-request';
import { Emoji } from '../models/entities/emoji';
import { ReversiGame } from '../models/entities/games/reversi/game';
import { ReversiMatching } from '../models/entities/games/reversi/matching';
import { UserNotePining } from '../models/entities/user-note-pinings';
import { Poll } from '../models/entities/poll';
import { UserKeypair } from '../models/entities/user-keypair';
import { UserPublickey } from '../models/entities/user-publickey';
import { UserProfile } from '../models/entities/user-profile';
import { UserSecurityKey } from '../models/entities/user-security-key';
import { AttestationChallenge } from '../models/entities/attestation-challenge';
import { Page } from '../models/entities/page';
import { PageLike } from '../models/entities/page-like';
import { ModerationLog } from '../models/entities/moderation-log';
import { UsedUsername } from '../models/entities/used-username';
import { Announcement } from '../models/entities/announcement';
import { AnnouncementRead } from '../models/entities/announcement-read';
import { Clip } from '../models/entities/clip';
import { ClipNote } from '../models/entities/clip-note';
import { Antenna } from '../models/entities/antenna';
import { AntennaNote } from '../models/entities/antenna-note';

const sqlLogger = dbLogger.createSubLogger('sql', 'white', false);

class MyCustomLogger implements Logger {
	private highlight(sql: string) {
		return highlight.highlight(sql, {
			language: 'sql', ignoreIllegals: true,
		});
	}

	public logQuery(query: string, parameters?: any[]) {
		sqlLogger.info(this.highlight(query));
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
	NoteUnread,
	Page,
	PageLike,
	Log,
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
	ReversiGame,
	ReversiMatching,
	...charts as any
];

export function initDb(justBorrow = false, sync = false, log = false, forceRecreate = false) {
	if (!forceRecreate) {
		try {
			const conn = getConnection();
			return Promise.resolve(conn);
		} catch (e) {}
	}

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
