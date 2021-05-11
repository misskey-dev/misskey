import * as Bull from 'bull';
import { ObjectStorageJobData } from '@/queue/types';
import deleteFile from './delete-file';
import cleanRemoteFiles from './clean-remote-files';

const jobs = {
	deleteFile,
	cleanRemoteFiles,
} as Record<string, Bull.ProcessCallbackFunction<ObjectStorageJobData> | Bull.ProcessPromiseFunction<ObjectStorageJobData>>;

export default function(q: Bull.Queue) {
	for (const [k, v] of Object.entries(jobs)) {
		q.process(k, 16, v);
	}
}
