import type { ObjectStorageJobData } from '@/queue/types.js';
import deleteFile from './delete-file.js';
import cleanRemoteFiles from './clean-remote-files.js';
import type Bull from 'bull';

const jobs = {
	deleteFile,
	cleanRemoteFiles,
} as Record<string, Bull.ProcessCallbackFunction<ObjectStorageJobData> | Bull.ProcessPromiseFunction<ObjectStorageJobData>>;

export default function(q: Bull.Queue) {
	for (const [k, v] of Object.entries(jobs)) {
		q.process(k, 16, v);
	}
}
