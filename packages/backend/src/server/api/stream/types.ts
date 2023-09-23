/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiChannel } from '@/models/Channel.js';
import type { MiUser } from '@/models/User.js';
import type { MiUserProfile } from '@/models/UserProfile.js';
import type { MiNote } from '@/models/Note.js';
import type { MiAntenna } from '@/models/Antenna.js';
import type { MiDriveFile } from '@/models/DriveFile.js';
import type { MiDriveFolder } from '@/models/DriveFolder.js';
import type { MiUserList } from '@/models/UserList.js';
import type { MiAbuseUserReport } from '@/models/AbuseUserReport.js';
import type { MiSignin } from '@/models/Signin.js';
import type { MiPage } from '@/models/Page.js';
import type { Packed } from '@/misc/json-schema.js';
import type { MiWebhook } from '@/models/Webhook.js';
import type { MiMeta } from '@/models/Meta.js';
import { MiRole, MiRoleAssignment } from '@/models/_.js';
import type Emitter from 'strict-event-emitter-types';
import type { EventEmitter } from 'events';

//#region Stream type-body definitions
export interface InternalStreamTypes {
	userChangeSuspendedState: { id: MiUser['id']; isSuspended: MiUser['isSuspended']; };
	userTokenRegenerated: { id: MiUser['id']; oldToken: string; newToken: string; };
	remoteUserUpdated: { id: MiUser['id']; };
	follow: { followerId: MiUser['id']; followeeId: MiUser['id']; };
	unfollow: { followerId: MiUser['id']; followeeId: MiUser['id']; };
	blockingCreated: { blockerId: MiUser['id']; blockeeId: MiUser['id']; };
	blockingDeleted: { blockerId: MiUser['id']; blockeeId: MiUser['id']; };
	policiesUpdated: MiRole['policies'];
	roleCreated: MiRole;
	roleDeleted: MiRole;
	roleUpdated: MiRole;
	userRoleAssigned: MiRoleAssignment;
	userRoleUnassigned: MiRoleAssignment;
	webhookCreated: MiWebhook;
	webhookDeleted: MiWebhook;
	webhookUpdated: MiWebhook;
	antennaCreated: MiAntenna;
	antennaDeleted: MiAntenna;
	antennaUpdated: MiAntenna;
	metaUpdated: MiMeta;
	followChannel: { userId: MiUser['id']; channelId: MiChannel['id']; };
	unfollowChannel: { userId: MiUser['id']; channelId: MiChannel['id']; };
	updateUserProfile: MiUserProfile;
	mute: { muterId: MiUser['id']; muteeId: MiUser['id']; };
	unmute: { muterId: MiUser['id']; muteeId: MiUser['id']; };
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
	announcementCreated: {
		announcement: Packed<'Announcement'>;
	};
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
		pageId: MiPage['id'];
		event: string;
		var: any;
		userId: MiUser['id'];
		user: Packed<'User'>;
	};
	urlUploadFinished: {
		marker?: string | null;
		file: Packed<'DriveFile'>;
	};
	readAllNotifications: undefined;
	unreadNotification: Packed<'Notification'>;
	unreadMention: MiNote['id'];
	readAllUnreadMentions: undefined;
	unreadSpecifiedNote: MiNote['id'];
	readAllUnreadSpecifiedNotes: undefined;
	readAllAntennas: undefined;
	unreadAntenna: MiAntenna;
	readAllAnnouncements: undefined;
	myTokenRegenerated: undefined;
	signin: MiSignin;
	registryUpdated: {
		scope?: string[];
		key: string;
		value: any | null;
	};
	driveFileCreated: Packed<'DriveFile'>;
	readAntenna: MiAntenna;
	receiveFollowRequest: Packed<'User'>;
	announcementCreated: {
		announcement: Packed<'Announcement'>;
	};
}

export interface DriveStreamTypes {
	fileCreated: Packed<'DriveFile'>;
	fileDeleted: MiDriveFile['id'];
	fileUpdated: Packed<'DriveFile'>;
	folderCreated: Packed<'DriveFolder'>;
	folderDeleted: MiDriveFolder['id'];
	folderUpdated: Packed<'DriveFolder'>;
}

export interface NoteStreamTypes {
	pollVoted: {
		choice: number;
		userId: MiUser['id'];
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
		userId: MiUser['id'];
	};
	unreacted: {
		reaction: string;
		userId: MiUser['id'];
	};
}
type NoteStreamEventTypes = {
	[key in keyof NoteStreamTypes]: {
		id: MiNote['id'];
		body: NoteStreamTypes[key];
	};
};

export interface UserListStreamTypes {
	userAdded: Packed<'User'>;
	userRemoved: Packed<'User'>;
}

export interface AntennaStreamTypes {
	note: MiNote;
}

export interface RoleTimelineStreamTypes {
	note: Packed<'Note'>;
}

export interface AdminStreamTypes {
	newAbuseUserReport: {
		id: MiAbuseUserReport['id'];
		targetUserId: MiUser['id'],
		reporterId: MiUser['id'],
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
export type Serialized<T> = {
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
	main: {
		name: `mainStream:${MiUser['id']}`;
		payload: EventUnionFromDictionary<SerializedAll<MainStreamTypes>>;
	};
	drive: {
		name: `driveStream:${MiUser['id']}`;
		payload: EventUnionFromDictionary<SerializedAll<DriveStreamTypes>>;
	};
	note: {
		name: `noteStream:${MiNote['id']}`;
		payload: EventUnionFromDictionary<SerializedAll<NoteStreamEventTypes>>;
	};
	userList: {
		name: `userListStream:${MiUserList['id']}`;
		payload: EventUnionFromDictionary<SerializedAll<UserListStreamTypes>>;
	};
	roleTimeline: {
		name: `roleTimelineStream:${MiRole['id']}`;
		payload: EventUnionFromDictionary<SerializedAll<RoleTimelineStreamTypes>>;
	};
	antenna: {
		name: `antennaStream:${MiAntenna['id']}`;
		payload: EventUnionFromDictionary<SerializedAll<AntennaStreamTypes>>;
	};
	admin: {
		name: `adminStream:${MiUser['id']}`;
		payload: EventUnionFromDictionary<SerializedAll<AdminStreamTypes>>;
	};
	notes: {
		name: 'notesStream';
		payload: Serialized<Packed<'Note'>>;
	};
};

// API event definitions
// ストリームごとのEmitterの辞書を用意
type EventEmitterDictionary = { [x in keyof StreamMessages]: Emitter.default<EventEmitter, { [y in StreamMessages[x]['name']]: (e: StreamMessages[x]['payload']) => void }> };
// 共用体型を交差型にする型 https://stackoverflow.com/questions/54938141/typescript-convert-union-to-intersection
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;
// Emitter辞書から共用体型を作り、UnionToIntersectionで交差型にする
export type StreamEventEmitter = UnionToIntersection<EventEmitterDictionary[keyof StreamMessages]>;
// { [y in name]: (e: spec) => void }をまとめてその交差型をEmitterにかけるとts(2590)にひっかかる

// provide stream channels union
export type StreamChannels = StreamMessages[keyof StreamMessages]['name'];
