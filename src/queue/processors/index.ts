import deliver from './http/deliver';
import processInbox from './http/process-inbox';
import { deleteNotes } from './delete-notes';
import { deleteDriveFiles } from './delete-drive-files';
import { exportNotes } from './export-notes';
import { exportFollowing } from './export-following';
import { exportMute } from './export-mute';
import { exportBlocking } from './export-blocking';
import { queueLogger } from '../logger';

const handlers: any = {
	deliver,
	processInbox,
	deleteNotes,
	deleteDriveFiles,
	exportNotes,
	exportFollowing,
	exportMute,
	exportBlocking,
};

export default (job: any, done: any) => {
	const handler = handlers[job.data.type];

	if (handler) {
		handler(job, done);
	} else {
		queueLogger.error(`Unknown job: ${job.data.type}`);
		done();
	}
};
