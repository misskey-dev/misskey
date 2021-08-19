import * as Bull from 'bull';
import { DbJobData } from '@/queue/types.js';
import { deleteDriveFiles } from './delete-drive-files.js';
import { exportNotes } from './export-notes.js';
import { exportFollowing } from './export-following.js';
import { exportMute } from './export-mute.js';
import { exportBlocking } from './export-blocking.js';
import { exportUserLists } from './export-user-lists.js';
import { importFollowing } from './import-following.js';
import { importUserLists } from './import-user-lists.js';

const jobs = {
	deleteDriveFiles,
	exportNotes,
	exportFollowing,
	exportMute,
	exportBlocking,
	exportUserLists,
	importFollowing,
	importUserLists
} as Record<string, Bull.ProcessCallbackFunction<DbJobData> | Bull.ProcessPromiseFunction<DbJobData>>;

export default function(dbQueue: Bull.Queue<DbJobData>) {
	for (const [k, v] of Object.entries(jobs)) {
		dbQueue.process(k, v);
	}
}
