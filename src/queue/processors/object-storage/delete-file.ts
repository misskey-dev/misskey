import * as Bull from 'bull';
import { deleteObjectStorageFile } from '../../../services/drive/delete-file';

export default async (job: Bull.Job) => {
	const key: string = job.data.key;

	await deleteObjectStorageFile(key);

	return 'Success';
};
