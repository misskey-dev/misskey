import * as Bull from 'bull';
import { deleteDriveFiles } from './delete-drive-files';
import { exportNotes } from './export-notes';
import { exportFollowing } from './export-following';
import { exportMute } from './export-mute';
import { exportBlocking } from './export-blocking';
import { exportUserLists } from './export-user-lists';
import { importFollowing } from './import-following';
import { importUserLists } from './import-user-lists';
import { ILocalUser } from '../../../models/entities/user';
import { DriveFile } from '../../../models/entities/drive-file';

const jobs = {
	deleteDriveFiles,
	exportNotes,
	exportFollowing,
	exportMute,
	exportBlocking,
	exportUserLists,
	importFollowing,
	importUserLists
};

export type DbJobData = {
	user: ILocalUser;
	fileId?: DriveFile['id'];
};

export default function(dbQueue: Bull.Queue<DbJobData>) {
	for (const [k, v] of Object.entries(jobs)) {
		dbQueue.process(k, v);
	}
}
