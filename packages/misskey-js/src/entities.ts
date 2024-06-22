import { ModerationLogPayloads } from './consts.js';
import { Announcement, EmojiDetailed, MeDetailed, Page, User, UserDetailedNotMe } from './autogen/models.js';

export * from './autogen/entities.js';
export * from './autogen/models.js';

export type ID = string;
export type DateString = string;

export type PageEvent = {
	pageId: Page['id'];
	event: string;
	var: any;
	userId: User['id'];
	user: User;
};

export type ModerationLog = {
	id: ID;
	createdAt: DateString;
	userId: User['id'];
	user: UserDetailedNotMe | null;
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
	type: 'updateRemoteInstanceNote';
	info: ModerationLogPayloads['updateRemoteInstanceNote'];
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
	type: 'createSystemWebhook';
	info: ModerationLogPayloads['createSystemWebhook'];
} | {
	type: 'updateSystemWebhook';
	info: ModerationLogPayloads['updateSystemWebhook'];
} | {
	type: 'deleteSystemWebhook';
	info: ModerationLogPayloads['deleteSystemWebhook'];
} | {
	type: 'createAbuseReportNotificationRecipient';
	info: ModerationLogPayloads['createAbuseReportNotificationRecipient'];
} | {
	type: 'updateAbuseReportNotificationRecipient';
	info: ModerationLogPayloads['updateAbuseReportNotificationRecipient'];
} | {
	type: 'deleteAbuseReportNotificationRecipient';
	info: ModerationLogPayloads['deleteAbuseReportNotificationRecipient'];
});

export type ServerStats = {
	cpu: number;
	mem: {
		used: number;
		active: number;
	};
	net: {
		rx: number;
		tx: number;
	};
	fs: {
		r: number;
		w: number;
	}
};

export type ServerStatsLog = ServerStats[];

export type QueueStats = {
	deliver: {
		activeSincePrevTick: number;
		active: number;
		waiting: number;
		delayed: number;
	};
	inbox: {
		activeSincePrevTick: number;
		active: number;
		waiting: number;
		delayed: number;
	};
};

export type QueueStatsLog = QueueStats[];

export type EmojiAdded = {
	emoji: EmojiDetailed
};

export type EmojiUpdated = {
	emojis: EmojiDetailed[]
};

export type EmojiDeleted = {
	emojis: EmojiDetailed[]
};

export type AnnouncementCreated = {
	announcement: Announcement;
};

export type SignupRequest = {
	username: string;
	password: string;
	host?: string;
	invitationCode?: string;
	emailAddress?: string;
	'hcaptcha-response'?: string | null;
	'g-recaptcha-response'?: string | null;
	'turnstile-response'?: string | null;
}

export type SignupResponse = MeDetailed & {
	token: string;
}

export type SignupPendingRequest = {
	code: string;
};

export type SignupPendingResponse = {
	id: User['id'],
	i: string,
};

export type SignupErrors = {
	message: 'DUPLICATED_USERNAME',
	code: 400,
} | {
	message: 'USED_USERNAME',
	code: 400,
} | {
	message: 'DENIED_USERNAME',
	code: 400,
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
} | Record<string, any>;

export type SigninRequest = {
	username: string;
	password: string;
	token?: string;
};

export type SigninResponse = {
	id: User['id'],
	i: string,
};

export type SigninErrors = {
	message: 'Too many failed attempts to sign in. Try again later.',
	code: 'TOO_MANY_AUTHENTICATION_FAILURES',
	id: '22d05606-fbcf-421a-a2db-b32610dcfd1b',
} | {
	id: '6cc579cc-885d-43d8-95c2-b8c7fc963280', // User not found
} | {
	id: 'e03a5f46-d309-4865-9b69-56282d94e1eb', // User is suspended
} | {
	id: '4e30e80c-e338-45a0-8c8f-44455efa3b76', // Internal server error
} | {
	id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c', // Invalid credentials
} | {
	id: 'cdf1235b-ac71-46d4-a3a6-84ccce48df6f', // Invalid one-time password
} | {
	id: '93b86c4b-72f9-40eb-9815-798928603d1e', // Invalid passkey credential
};
