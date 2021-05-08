import { ObjectStorageFileJobData } from '@/queue/types';
import * as Bull from 'bull';
import { deleteObjectStorageFile } from '../../../services/drive/delete-file';

export default async (job: Bull.Job<ObjectStorageFileJobData>) => {
	const key: string = job.data.key;

	await deleteObjectStorageFile(key);

	return 'Success';
};
