import { createConnection, Logger } from 'typeorm';
import config from '../config';
import { dbLogger } from './logger';
import { Log } from '../models/log';
import { User } from '../models/user';
import { DriveFile } from '../models/drive-file';
import { DriveFolder } from '../models/drive-folder';
import { AccessToken } from '../models/access-token';
import { App } from '../models/app';
import { PollVote } from '../models/poll-vote';
import { NoteReaction } from '../models/note-reaction';
import { Emoji } from '../models/emoji';
import { Note } from '../models/note';
import { entities as charts } from '../services/chart/entities';
import { Notification } from '../models/notification';
import { Meta } from '../models/meta';

const sqlLogger = dbLogger.createSubLogger('sql', 'white', false);

class MyCustomLogger implements Logger {
	public logQuery(query: string, parameters?: any[]) {
		sqlLogger.info(query);
	}

	public logQueryError(error: string, query: string, parameters?: any[]) {
		sqlLogger.error(query);
	}

	public logQuerySlow(time: number, query: string, parameters?: any[]) {
		sqlLogger.warn(query);
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

export function initPostgre() {
	return createConnection({
		type: 'postgres',
		host: config.db.host,
		port: config.db.port,
		username: config.db.user,
		password: config.db.pass,
		database: config.db.db,
		synchronize: true,
		logging: !['production', 'test'].includes(process.env.NODE_ENV),
		logger: new MyCustomLogger(),
		entities: [
			Meta,
			App,
			User,
			Note,
			Log,
			DriveFile,
			DriveFolder,
			AccessToken,
			PollVote,
			NoteReaction,
			Notification,
			Emoji,
			...charts
		]
	});
}
