import { ObjectStorageFileJobData } from '@/queue/types.js';
import Bull from 'bull';
import { deleteObjectStorageFile } from '@/services/drive/delete-file.js';

export default async (job: Bull.Job<ObjectStorageFileJobData>) => {
	const key: string = job.data.key;

	await deleteObjectStorageFile(key);

	return 'Success';
};
