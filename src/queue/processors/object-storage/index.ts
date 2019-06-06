import * as Bull from 'bull';
import deleteFile from './delete-file';

const jobs = {
	deleteFile,
};

export default function(q: Bull.Queue) {
	for (const [k, v] of Object.entries(jobs)) {
		q.process(k, v);
	}
}
