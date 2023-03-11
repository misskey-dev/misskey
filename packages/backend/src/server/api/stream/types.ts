import type { Channel } from '@/models/entities/Channel.js';
import type { User } from '@/models/entities/User.js';
import type { UserProfile } from '@/models/entities/UserProfile.js';
import type { Note } from '@/models/entities/Note.js';
import type { Antenna } from '@/models/entities/Antenna.js';
import type { DriveFile } from '@/models/entities/DriveFile.js';
import type { DriveFolder } from '@/models/entities/DriveFolder.js';
import type { UserList } from '@/models/entities/UserList.js';
import type { AbuseUserReport } from '@/models/entities/AbuseUserReport.js';
import type { Signin } from '@/models/entities/Signin.js';
import type { Page } from '@/models/entities/Page.js';
import type { Packed } from '@/misc/json-schema.js';
import type { Webhook } from '@/models/entities/Webhook.js';
import type { Meta } from '@/models/entities/Meta.js';
import { Role, RoleAssignment } from '@/models';
import type Emitter from 'strict-event-emitter-types';
import type { EventEmitter } from 'events';

//#region Stream type-body definitions
export interface InternalStreamTypes {
	userChangeSuspendedState: { id: User['id']; isSuspended: User['isSuspended']; };
	userTokenRegenerated: { id: User['id']; oldToken: User['token']; newToken: User['token']; };
	remoteUserUpdated: { id: User['id']; };
	follow: { followerId: User['id']; followeeId: User['id']; };
	unfollow: { followerId: User['id']; followeeId: User['id']; };
	blockingCreated: { blockerId: User['id']; blockeeId: User['id']; };
	blockingDeleted: { blockerId: User['id']; blockeeId: User['id']; };
	policiesUpdated: Role['policies'];
	roleCreated: Role;
	roleDeleted: Role;
	roleUpdated: Role;
	userRoleAssigned: RoleAssignment;
	userRoleUnassigned: RoleAssignment;
	webhookCreated: Webhook;
	webhookDeleted: Webhook;
	webhookUpdated: Webhook;
	antennaCreated: Antenna;
	antennaDeleted: Antenna;
	antennaUpdated: Antenna;
	metaUpdated: Meta;
}

export interface BroadcastTypes {
	emojiAdded: {
		emoji: Packed<'EmojiDetailed'>;
	};
	emojiUpdated: {
		emojis: Packed<'EmojiDetailed'>[];
	};
	emojiDeleted: {
		emojis: {
			id?: string;
			name: string;
			[other: string]: any;
		}[];
	};
}

export interface UserStreamTypes {
	terminate: Record<string, unknown>;
	followChannel: Channel;
	unfollowChannel: Channel;
	updateUserProfile: UserProfile;
	mute: User;
	unmute: User;
	follow: Packed<'UserDetailedNotMe'>;
	unfollow: Packed<'User'>;
	userAdded: Packed<'User'>;
}

export interface MainStreamTypes {
	notification: Packed<'Notification'>;
	mention: Packed<'Note'>;
	reply: Packed<'Note'>;
	renote: Packed<'Note'>;
	follow: Packed<'UserDetailedNotMe'>;
	followed: Packed<'User'>;
	unfollow: Packed<'User'>;
	meUpdated: Packed<'User'>;
	pageEvent: {
		pageId: Page['id'];
		event: string;
		var: any;
		userId: User['id'];
		user: Packed<'User'>;
	};
	urlUploadFinished: {
		marker?: string | null;
		file: Packed<'DriveFile'>;
	};
	readAllNotifications: undefined;
	unreadNotification: Packed<'Notification'>;
	unreadMention: Note['id'];
	readAllUnreadMentions: undefined;
	unreadSpecifiedNote: Note['id'];
	readAllUnreadSpecifiedNotes: undefined;
	readAllAntennas: undefined;
	unreadAntenna: Antenna;
	readAllAnnouncements: undefined;
	readAllChannels: undefined;
	unreadChannel: Note['id'];
	myTokenRegenerated: undefined;
	signin: Signin;
	registryUpdated: {
		scope?: string[];
		key: string;
		value: any | null;
	};
	driveFileCreated: Packed<'DriveFile'>;
	readAntenna: Antenna;
	receiveFollowRequest: Packed<'User'>;
}

export interface DriveStreamTypes {
	fileCreated: Packed<'DriveFile'>;
	fileDeleted: DriveFile['id'];
	fileUpdated: Packed<'DriveFile'>;
	folderCreated: Packed<'DriveFolder'>;
	folderDeleted: DriveFolder['id'];
	folderUpdated: Packed<'DriveFolder'>;
}

export interface NoteStreamTypes {
	pollVoted: {
		choice: number;
		userId: User['id'];
	};
	deleted: {
		deletedAt: Date;
	};
	reacted: {
		reaction: string;
		emoji?: {
			name: string;
			url: string;
		} | null;
		userId: User['id'];
	};
	unreacted: {
		reaction: string;
		userId: User['id'];
	};
}
type NoteStreamEventTypes = {
	[key in keyof NoteStreamTypes]: {
		id: Note['id'];
		body: NoteStreamTypes[key];
	};
};

export interface UserListStreamTypes {
	userAdded: Packed<'User'>;
	userRemoved: Packed<'User'>;
}

export interface AntennaStreamTypes {
	note: Note;
}

export interface AdminStreamTypes {
	newAbuseUserReport: {
		id: AbuseUserReport['id'];
		targetUserId: User['id'],
		reporterId: User['id'],
		comment: string;
	};
}
//#endregion

// 辞書(interface or type)から{ type, body }ユニオンを定義
// https://stackoverflow.com/questions/49311989/can-i-infer-the-type-of-a-value-using-extends-keyof-type
// VS Codeの展開を防止するためにEvents型を定義
type Events<T extends object> = { [K in keyof T]: { type: K; body: T[K]; } };
type EventUnionFromDictionary<
	T extends object,
	U = Events<T>
> = U[keyof U];

// redis通すとDateのインスタンスはstringに変換されるので
type Serialized<T> = {
	[K in keyof T]:
		T[K] extends Date
			? string
			: T[K] extends (Date | null)
				? (string | null)
				: T[K] extends Record<string, any>
					? Serialized<T[K]>
					: T[K];
};

type SerializedAll<T> = {
	[K in keyof T]: Serialized<T[K]>;
};

// name/messages(spec) pairs dictionary
export type StreamMessages = {
	internal: {
		name: 'internal';
		payload: EventUnionFromDictionary<SerializedAll<InternalStreamTypes>>;
	};
	broadcast: {
		name: 'broadcast';
		payload: EventUnionFromDictionary<SerializedAll<BroadcastTypes>>;
	};
	user: {
		name: `user:${User['id']}`;
		payload: EventUnionFromDictionary<SerializedAll<UserStreamTypes>>;
	};
	main: {
		name: `mainStream:${User['id']}`;
		payload: EventUnionFromDictionary<SerializedAll<MainStreamTypes>>;
	};
	drive: {
		name: `driveStream:${User['id']}`;
		payload: EventUnionFromDictionary<SerializedAll<DriveStreamTypes>>;
	};
	note: {
		name: `noteStream:${Note['id']}`;
		payload: EventUnionFromDictionary<SerializedAll<NoteStreamEventTypes>>;
	};
	userList: {
		name: `userListStream:${UserList['id']}`;
		payload: EventUnionFromDictionary<SerializedAll<UserListStreamTypes>>;
	};
	antenna: {
		name: `antennaStream:${Antenna['id']}`;
		payload: EventUnionFromDictionary<SerializedAll<AntennaStreamTypes>>;
	};
	admin: {
		name: `adminStream:${User['id']}`;
		payload: EventUnionFromDictionary<SerializedAll<AdminStreamTypes>>;
	};
	notes: {
		name: 'notesStream';
		payload: Serialized<Packed<'Note'>>;
	};
};

// API event definitions
// ストリームごとのEmitterの辞書を用意
type EventEmitterDictionary = { [x in keyof StreamMessages]: Emitter<EventEmitter, { [y in StreamMessages[x]['name']]: (e: StreamMessages[x]['payload']) => void }> };
// 共用体型を交差型にする型 https://stackoverflow.com/questions/54938141/typescript-convert-union-to-intersection
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;
// Emitter辞書から共用体型を作り、UnionToIntersectionで交差型にする
export type StreamEventEmitter = UnionToIntersection<EventEmitterDictionary[keyof StreamMessages]>;
// { [y in name]: (e: spec) => void }をまとめてその交差型をEmitterにかけるとts(2590)にひっかかる

// provide stream channels union
export type StreamChannels = StreamMessages[keyof StreamMessages]['name'];
