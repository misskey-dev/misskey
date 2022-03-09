import Bull from 'bull';
import { DbJobData } from '@/queue/types.js';
import { deleteDriveFiles } from './delete-drive-files.js';
import { exportCustomEmojis } from './export-custom-emojis.js';
import { exportNotes } from './export-notes.js';
import { exportFollowing } from './export-following.js';
import { exportMute } from './export-mute.js';
import { exportBlocking } from './export-blocking.js';
import { exportUserLists } from './export-user-lists.js';
import { importFollowing } from './import-following.js';
import { importUserLists } from './import-user-lists.js';
import { deleteAccount } from './delete-account.js';
import { importMuting } from './import-muting.js';
import { importBlocking } from './import-blocking.js';
import { importCustomEmojis } from './import-custom-emojis.js';

const jobs = {
	deleteDriveFiles,
	exportCustomEmojis,
	exportNotes,
	exportFollowing,
	exportMute,
	exportBlocking,
	exportUserLists,
	importFollowing,
	importMuting,
	importBlocking,
	importUserLists,
	importCustomEmojis,
	deleteAccount,
} as Record<string, Bull.ProcessCallbackFunction<DbJobData> | Bull.ProcessPromiseFunction<DbJobData>>;

export default function(dbQueue: Bull.Queue<DbJobData>) {
	for (const [k, v] of Object.entries(jobs)) {
		dbQueue.process(k, v);
	}
}
