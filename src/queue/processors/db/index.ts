import * as Bull from 'bull';
import { DbJobData } from '@/queue/types';
import { deleteDriveFiles } from './delete-drive-files';
import { exportNotes } from './export-notes';
import { exportFollowing } from './export-following';
import { exportMute } from './export-mute';
import { exportBlocking } from './export-blocking';
import { exportUserLists } from './export-user-lists';
import { importFollowing } from './import-following';
import { importUserLists } from './import-user-lists';
import { deleteAccount_deleteNotes } from './delete-account/delete-notes';
import { deleteAccount_deleteFiles } from './delete-account/delete-files';
import { deleteAccount_deleteAccount } from './delete-account/delete-account';

const jobs = {
	deleteDriveFiles,
	exportNotes,
	exportFollowing,
	exportMute,
	exportBlocking,
	exportUserLists,
	importFollowing,
	importUserLists,

	deleteAccount_deleteNotes,
	deleteAccount_deleteFiles,
	deleteAccount_deleteAccount,
} as Record<string, Bull.ProcessCallbackFunction<DbJobData> | Bull.ProcessPromiseFunction<DbJobData>>;

export default function(dbQueue: Bull.Queue<DbJobData>) {
	for (const [k, v] of Object.entries(jobs)) {
		dbQueue.process(k, v);
	}
}
