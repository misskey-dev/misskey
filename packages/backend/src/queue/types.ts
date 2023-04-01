import type { DriveFile } from '@/models/entities/DriveFile.js';
import type { Note } from '@/models/entities/Note.js';
import type { User } from '@/models/entities/User.js';
import type { Webhook } from '@/models/entities/Webhook.js';
import type { IActivity } from '@/core/activitypub/type.js';
import type httpSignature from '@peertube/http-signature';

export type DeliverJobData = {
	/** Actor */
	user: ThinUser;
	/** Activity */
	content: unknown;
	/** inbox URL to deliver */
	to: string;
	/** whether it is sharedInbox */
	isSharedInbox: boolean;
};

export type InboxJobData = {
	activity: IActivity;
	signature: httpSignature.IParsedSignature;
};

export type DbJobData = DbUserJobData | DbUserImportJobData | DbUserDeleteJobData;

export type DbUserJobData = {
	user: ThinUser;
	excludeMuting: boolean;
	excludeInactive: boolean;
};

export type DbUserDeleteJobData = {
	user: ThinUser;
	soft?: boolean;
};

export type DbUserImportJobData = {
	user: ThinUser;
	fileId: DriveFile['id'];
};

export type ObjectStorageJobData = ObjectStorageFileJobData | Record<string, unknown>;

export type ObjectStorageFileJobData = {
	key: string;
};

export type EndedPollNotificationJobData = {
	noteId: Note['id'];
};

export type WebhookDeliverJobData = {
	type: string;
	content: unknown;
	webhookId: Webhook['id'];
	userId: User['id'];
	to: string;
	secret: string;
	createdAt: number;
	eventId: string;
};

export type ThinUser = {
	id: User['id'];
};
