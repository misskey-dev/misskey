import { DriveFile } from '@/models/entities/drive-file.js';
import { User } from '@/models/entities/user.js';
import { IActivity } from '@/remote/activitypub/type.js';
import * as httpSignature from 'http-signature';

export type DeliverJobData = {
	/** Actor */
	user: ThinUser;
	/** Activity */
	content: unknown;
	/** inbox URL to deliver */
	to: string;
};

export type InboxJobData = {
	activity: IActivity;
	signature: httpSignature.IParsedSignature;
};

export type DbJobData = DbUserJobData | DbUserImportJobData;

export type DbUserJobData = {
	user: ThinUser;
};

export type DbUserImportJobData = {
	user: ThinUser;
	fileId: DriveFile['id'];
};

export type ObjectStorageJobData = ObjectStorageFileJobData | {};

export type ObjectStorageFileJobData = {
	key: string;
};

export type ThinUser = {
	id: User['id'];
};
