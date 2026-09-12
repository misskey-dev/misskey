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
import type {
	AuthenticationResponseJSON,
	RegistrationResponseJSON,
	PublicKeyCredentialCreationOptionsJSON,
	PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';

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
type AllNullOrOptionalRecord<T> = {
	[P in keyof T]: never;
};

export type PureRenote =
	Omit<Note, 'renote' | 'renoteId' | 'reply' | 'replyId' | 'text' | 'cw' | 'files' | 'fileIds' | 'poll'>
	& AllNullRecord<Pick<Note, 'text'>>
	& AllNullOrOptionalRecord<Pick<Note, 'reply' | 'replyId' | 'cw' | 'poll'>>
	& { files: []; fileIds: []; }
	& NonNullableRecord<Pick<Note, 'renoteId'>>
	& Pick<Note, 'renote'>; // リノート対象が削除された場合、renoteIdはあるがrenoteはnullになる

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
	user: UserDetailedNotMe;
} & ({
	[K in keyof ModerationLogPayloads]: {
		type: K;
		info: ModerationLogPayloads[K];
	};
}[keyof ModerationLogPayloads]);

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
	'testcaptcha-response'?: string | null;
};

export type SignupResponse = MeDetailed & {
	token: string;
};

export type SignupPendingRequest = {
	code: string;
};

export type SignupPendingResponse = {
	id: User['id'],
	i: string,
};

// サインインは /api ではなく /auth 配下 (POST /auth/signin/init と /auth/signin/continue) で
// 行うため api.types.ts の Endpoints には載らない。backend 側もこの型を import して使う。

export type SigninCaptchaResponse = {
	type: 'hcaptcha' | 'recaptcha-v2' | 'turnstile' | 'm-captcha' | 'testcaptcha';
	response: string;
};

//#region POST /auth/signin/init
export type SigninInitRequest = Record<string, never>;

export type SigninInitResponse = {
	sessionId: string;
	/** セッション失効の epoch ms。クライアントはこの手前で再 init する */
	expiresAt: number;
	/** Conditional Mediation 用の匿名 challenge */
	passkeyOptions: PublicKeyCredentialRequestOptionsJSON;
};
//#endregion

//#region POST /auth/signin/continue
type SigninContinueBase = {
	sessionId: string;
};

export type SigninContinueRequestUsername = SigninContinueBase & {
	username: string;
	captchaResponse?: SigninCaptchaResponse;
};
export type SigninContinueRequestPassword = SigninContinueBase & {
	password: string;
};
export type SigninContinueRequestTotp = SigninContinueBase & {
	token: string;
};
export type SigninContinueRequestPasskey = SigninContinueBase & {
	passkeyCredential: AuthenticationResponseJSON;
};

export type SigninContinueRequest =
	| SigninContinueRequestUsername
	| SigninContinueRequestPassword
	| SigninContinueRequestTotp
	| SigninContinueRequestPasskey;

export type SigninContinueResponse = {
	finished: false;
	next: 'password' | 'totp';
	expiresAt: number;
} | {
	finished: false;
	next: 'passkey' | 'totpOrPasskey';
	expiresAt: number;
	passkeyOptions: PublicKeyCredentialRequestOptionsJSON;
} | {
	finished: true;
	id: User['id'];
	i: string;
};
//#endregion

export type I2faPasskeyRegisterResponse = PublicKeyCredentialCreationOptionsJSON;

export type I2faPasskeyDoneRequest = {
	password: string;
	token?: string | null;
	name: string;
	credential: RegistrationResponseJSON;
};

type Values<T extends Record<PropertyKey, unknown>> = T[keyof T];

export type PartialRolePolicyOverride = Partial<{ [k in keyof RolePolicies]: Omit<Values<Role['policies']>, 'value'> & { value: RolePolicies[k] } }>;
