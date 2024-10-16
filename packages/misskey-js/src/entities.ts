import { ModerationLogPayloads } from './consts.js';
import {
	Announcement,
	EmojiDetailed,
	MeDetailed,
	Note,
	Page,
	Role,
	RolePolicies,
	User,
	UserDetailedNotMe,
} from './autogen/models.js';
import type { AuthenticationResponseJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/types';

export * from './autogen/entities.js';
export * from './autogen/models.js';

export type ID = string;
export type DateString = string;

type NonNullableRecord<T> = {
	[P in keyof T]-?: NonNullable<T[P]>;
};
type AllNullRecord<T> = {
	[P in keyof T]: null;
};

export type PureRenote =
	Omit<Note, 'renote' | 'renoteId' | 'reply' | 'replyId' | 'text' | 'cw' | 'files' | 'fileIds' | 'poll'>
	& AllNullRecord<Pick<Note, 'reply' | 'replyId' | 'text' | 'cw' | 'poll'>>
	& { files: []; fileIds: []; }
	& NonNullableRecord<Pick<Note, 'renote' | 'renoteId'>>;

export type PageEvent = {
	pageId: Page['id'];
	event: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
	type: 'forwardAbuseReport';
	info: ModerationLogPayloads['forwardAbuseReport'];
} | {
	type: 'updateAbuseReportNote';
	info: ModerationLogPayloads['updateAbuseReportNote'];
} | {
	type: 'unsetUserAvatar';
	info: ModerationLogPayloads['unsetUserAvatar'];
} | {
	type: 'unsetUserBanner';
	info: ModerationLogPayloads['unsetUserBanner'];
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
} | {
	type: 'deleteAccount';
	info: ModerationLogPayloads['deleteAccount'];
} | {
	type: 'deletePage';
	info: ModerationLogPayloads['deletePage'];
} | {
	type: 'deleteFlash';
	info: ModerationLogPayloads['deleteFlash'];
} | {
	type: 'deleteGalleryPost';
	info: ModerationLogPayloads['deleteGalleryPost'];
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
	'm-captcha-response'?: string | null;
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

export type SigninFlowRequest = {
	username: string;
	password?: string;
	token?: string;
	credential?: AuthenticationResponseJSON;
	'hcaptcha-response'?: string | null;
	'g-recaptcha-response'?: string | null;
	'turnstile-response'?: string | null;
	'm-captcha-response'?: string | null;
};

export type SigninFlowResponse = {
	finished: true;
	id: User['id'];
	i: string;
} | {
	finished: false;
	next: 'captcha' | 'password' | 'totp';
} | {
	finished: false;
	next: 'passkey';
	authRequest: PublicKeyCredentialRequestOptionsJSON;
};

type WebAuthnServiceErrors = {
	id: '2d16e51c-007b-4edd-afd2-f7dd02c947f6', // Invalid context (WebAuthnService)
} | {
	id: '36b96a7d-b547-412d-aeed-2d611cdc8cdc', // Unknown WebAuthn Key (WebAuthnService)
} | {
	id: 'b18c89a7-5b5e-4cec-bb5b-0419f332d430', // Verification failed (WebAuthnService)
};

export type SigninFlowErrors = {
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
} | WebAuthnServiceErrors;

export type SigninWithPasskeyRequest = {
	credential?: AuthenticationResponseJSON;
	context?: string;
};

export type SigninWithPasskeyInitResponse = {
	option: PublicKeyCredentialRequestOptionsJSON;
	context: string;
};

export type SigninWithPasskeyResponse = {
	signinResponse: SigninFlowResponse & { finished: true };
};

export type SigninWithPasskeyErrors = {
	message: 'Too many failed attempts to sign in. Try again later.',
	code: 'TOO_MANY_AUTHENTICATION_FAILURES',
	id: '22d05606-fbcf-421a-a2db-b32610dcfd1b',
} | {
	id: '4e30e80c-e338-45a0-8c8f-44455efa3b76', // Internal server error
} | {
	id: '1658cc2e-4495-461f-aee4-d403cdf073c1', // No Context
} | {
	id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c', // Invalid credentials
} | {
	id: '652f899f-66d4-490e-993e-6606c8ec04c3', // User not found
} | {
	id: 'e03a5f46-d309-4865-9b69-56282d94e1eb', // User is suspended
} | {
	id: '2d84773e-f7b7-4d0b-8f72-bb69b584c912', // Passwordless Login is disabled
} | WebAuthnServiceErrors;

type Values<T extends Record<PropertyKey, unknown>> = T[keyof T];

export type PartialRolePolicyOverride = Partial<{[k in keyof RolePolicies]: Omit<Values<Role['policies']>, 'value'> & { value: RolePolicies[k] }}>;
