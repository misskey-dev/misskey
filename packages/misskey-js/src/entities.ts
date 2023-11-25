import { ModerationLogPayloads, notificationTypes } from './consts.js';
import { DriveFile, Page, User, UserDetailed } from './autogen/models';
export * from './autogen/entities';
export * from './autogen/models';

export type ID = string;
export type DateString = string;

type TODO = Record<string, any>;

export type UserGroup = TODO;

export type MessagingMessage = {
	id: ID;
	createdAt: DateString;
	file: DriveFile | null;
	fileId: DriveFile['id'] | null;
	isRead: boolean;
	reads: User['id'][];
	text: string | null;
	user: User;
	userId: User['id'];
	recipient?: User | null;
	recipientId: User['id'] | null;
	group?: UserGroup | null;
	groupId: UserGroup['id'] | null;
};

export type PageEvent = {
	pageId: Page['id'];
	event: string;
	var: any;
	userId: User['id'];
	user: User;
};

export type UserSorting =
	| '+follower'
	| '-follower'
	| '+createdAt'
	| '-createdAt'
	| '+updatedAt'
	| '-updatedAt';
export type OriginType = 'combined' | 'local' | 'remote';

export type ModerationLog = {
	id: ID;
	createdAt: DateString;
	userId: User['id'];
	user: UserDetailed | null;
} & ({
	type: 'updateServerSettings';
	info: ModerationLogPayloads['updateServerSettings'];
} | {
	type: 'suspend';
	info: ModerationLogPayloads['suspend'];
} | {
	type: 'unsuspend';
	info: ModerationLogPayloads['unsuspend'];
} | {
	type: 'updateUserNote';
	info: ModerationLogPayloads['updateUserNote'];
} | {
	type: 'addCustomEmoji';
	info: ModerationLogPayloads['addCustomEmoji'];
} | {
	type: 'updateCustomEmoji';
	info: ModerationLogPayloads['updateCustomEmoji'];
} | {
	type: 'deleteCustomEmoji';
	info: ModerationLogPayloads['deleteCustomEmoji'];
} | {
	type: 'assignRole';
	info: ModerationLogPayloads['assignRole'];
} | {
	type: 'unassignRole';
	info: ModerationLogPayloads['unassignRole'];
} | {
	type: 'createRole';
	info: ModerationLogPayloads['createRole'];
} | {
	type: 'updateRole';
	info: ModerationLogPayloads['updateRole'];
} | {
	type: 'deleteRole';
	info: ModerationLogPayloads['deleteRole'];
} | {
	type: 'clearQueue';
	info: ModerationLogPayloads['clearQueue'];
} | {
	type: 'promoteQueue';
	info: ModerationLogPayloads['promoteQueue'];
} | {
	type: 'deleteDriveFile';
	info: ModerationLogPayloads['deleteDriveFile'];
} | {
	type: 'deleteNote';
	info: ModerationLogPayloads['deleteNote'];
} | {
	type: 'createGlobalAnnouncement';
	info: ModerationLogPayloads['createGlobalAnnouncement'];
} | {
	type: 'createUserAnnouncement';
	info: ModerationLogPayloads['createUserAnnouncement'];
} | {
	type: 'updateGlobalAnnouncement';
	info: ModerationLogPayloads['updateGlobalAnnouncement'];
} | {
	type: 'updateUserAnnouncement';
	info: ModerationLogPayloads['updateUserAnnouncement'];
} | {
	type: 'deleteGlobalAnnouncement';
	info: ModerationLogPayloads['deleteGlobalAnnouncement'];
} | {
	type: 'deleteUserAnnouncement';
	info: ModerationLogPayloads['deleteUserAnnouncement'];
} | {
	type: 'resetPassword';
	info: ModerationLogPayloads['resetPassword'];
} | {
	type: 'suspendRemoteInstance';
	info: ModerationLogPayloads['suspendRemoteInstance'];
} | {
	type: 'unsuspendRemoteInstance';
	info: ModerationLogPayloads['unsuspendRemoteInstance'];
} | {
	type: 'markSensitiveDriveFile';
	info: ModerationLogPayloads['markSensitiveDriveFile'];
} | {
	type: 'unmarkSensitiveDriveFile';
	info: ModerationLogPayloads['unmarkSensitiveDriveFile'];
} | {
	type: 'createInvitation';
	info: ModerationLogPayloads['createInvitation'];
} | {
	type: 'createAd';
	info: ModerationLogPayloads['createAd'];
} | {
	type: 'updateAd';
	info: ModerationLogPayloads['updateAd'];
} | {
	type: 'deleteAd';
	info: ModerationLogPayloads['deleteAd'];
} | {
	type: 'createAvatarDecoration';
	info: ModerationLogPayloads['createAvatarDecoration'];
} | {
	type: 'updateAvatarDecoration';
	info: ModerationLogPayloads['updateAvatarDecoration'];
} | {
	type: 'deleteAvatarDecoration';
	info: ModerationLogPayloads['deleteAvatarDecoration'];
} | {
	type: 'resolveAbuseReport';
	info: ModerationLogPayloads['resolveAbuseReport'];
} | {
	type: 'unsetUserAvatar';
	info: ModerationLogPayloads['unsetUserAvatar'];
} | {
	type: 'unsetUserBanner';
	info: ModerationLogPayloads['unsetUserBanner'];
});
