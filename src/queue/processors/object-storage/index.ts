import * as Bull from 'bull';
import deleteFile from './delete-file';

const jobs = {
	deleteFile,
} as any;

export default function(q: Bull.Queue) {
	for (const [k, v] of Object.entries(jobs)) {
		q.process(k, 16, v as any);
	}
}
