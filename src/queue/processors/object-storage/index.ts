import * as Bull from 'bull';
import deleteFile from './delete-file';

const jobs = {
	deleteFile,
};

export type ObjectStorageJobData = {
	key: string;
};

export default function(q: Bull.Queue<ObjectStorageJobData>) {
	for (const [k, v] of Object.entries(jobs)) {
		q.process(k, v);
	}
}
