import * as Bull from 'bull';
import { deleteNotes } from './delete-notes';
import { deleteDriveFiles } from './delete-drive-files';
import { exportNotes } from './export-notes';
import { exportFollowing } from './export-following';
import { exportMute } from './export-mute';
import { exportBlocking } from './export-blocking';

const jobs = {
	deleteNotes,
	deleteDriveFiles,
	exportNotes,
	exportFollowing,
	exportMute,
	exportBlocking,
} as any;

export default function(job: Bull.Job, done: any) {
	jobs[job.data.type](job, done);
}
