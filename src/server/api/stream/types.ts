import { User } from '@/models/entities/user';
import { EventEmitter } from 'events';
import Emitter from 'strict-event-emitter-types';
import StreamTypes from 'misskey-js/built/streaming.types';
import { Channel } from '@/models/entities/channel';
import { UserProfile } from '@/models/entities/user-profile';
import { PackedUser } from '@/models/repositories/user';
import { PackedNotification } from '@/models/repositories/notification';
import { PackedNote } from '@/models/repositories/note';
import { Antenna } from '@/models/entities/antenna';
import { DriveFile } from '@/models/entities/drive-file';
import { PackedDriveFile } from '@/models/repositories/drive-file';
import { PackedDriveFolder } from '@/models/repositories/drive-folder';
import { DriveFolder } from '@/models/entities/drive-folder';
import { Note } from '@/models/entities/note';
import { Emoji } from '@/models/entities/emoji';

// 辞書(interface or type)から{ type, body }ユニオンを定義
// https://stackoverflow.com/questions/49311989/can-i-infer-the-type-of-a-value-using-extends-keyof-type
type EventUnionFromDictionary<
	T extends object,
	U = { [K in keyof T]: { type: K; body: T[K]} }
> = U[keyof U];

// (payload: P) => void からPを取り出す
type Payload<T extends (payload: any) => void> = T extends (payload: infer P) => void ? P : never;

// misskey.jsのstreaming.typesの辞書から{ type, body }ユニオンを定義
type EventUnionFromMkJSTypes<
	T extends { [key: string]: ((payload: any) => void) | (() => void) },
	U = { [K in keyof T]: { type: K; body: Payload<T[K]>} }
> = U[keyof U];

//#region Stream type-body definitions

// internal
export interface InternalStreamTypes {
	antennaCreated: Antenna;
	antennaDeleted: Antenna;
	antennaUpdated: Antenna;
}
export type InternalStreams = EventUnionFromDictionary<InternalStreamTypes>;

// broadcast
export type BroadcastStreams = EventUnionFromMkJSTypes<StreamTypes.BroadcasrEvents>;

// user
export type UserEventName = `user:${User['id']}`;
export interface UserStreamTypes {
	terminate: {};
	followChannel: Channel;
	unfollowChannel: Channel;
	updateUserProfile: UserProfile;
	mute: User;
	unmute: User;
	follow: PackedUser;
	unfollow: PackedUser;
	userAdded: PackedUser;
}
export type UserStreams = EventUnionFromDictionary<UserStreamTypes>;

// main
export type mainStreamName = `mainStream:${User['id']}`;
export interface MainStreamTypes {
	notification: PackedNotification;
	mention: PackedNote;
	reply: PackedNote;
	renote: PackedNote;
	follow: PackedUser;
	followed: PackedUser;
	unfollow: PackedUser;
	meUpdated: PackedUser;
	pageEvent: Payload<StreamTypes.Channels['main']['events']['pageEvent']>;
	urlUploadFinished: Payload<StreamTypes.Channels['main']['events']['urlUploadFinished']>;
	readAllNotifications: never;
	unreadNotification: never;
	unreadMention: never;
	readAllUnreadMentions: never;
	unreadSpecifiedNote: never;
	readAllUnreadSpecifiedNotes: never;
	readAllMessagingMessages: never;
	unreadMessagingMessage: never;
	readAllAntennas: never;
	unreadAntenna: never;
	readAllAnnouncements: never;
	readAllChannels: never;
	unreadChannel: never;
	myTokenRegenerated: never;
}
export type mainStreams = EventUnionFromDictionary<MainStreamTypes>;

// drive
export type driveStreamName = `driveStream:${User['id']}`;
export interface DriveStreamTypes {
	fileCreated: PackedDriveFile;
	fileDeleted: DriveFile['id'];
	fileUpdated: PackedDriveFile;
	folderCreated: PackedDriveFolder;
	folderDeleted: DriveFolder['id'];
	folderUpdated: PackedDriveFolder;
}
export type driveStreams= EventUnionFromDictionary<DriveStreamTypes>;

// note
export type noteStreamName = `noteStream:${Note['id']}`;
export interface NoteStreamTypes {
	pollVoted: {
		id: Note['id'];
		body: {
			choice: number;
			userId: User['id'];
		};
	};
	deleted: {
		id: Note['id'];
		body: {
			deletedAt: Date;
		};
	};
	reacted: {
		id: Note['id'];
		body: {
			reaction: string;
			emoji?: Emoji;
			userId: User['id'];
		};
	};
	unreacted: {
		id: Note['id'];
		body: {
			reaction: string;
			userId: User['id'];
		}
	};
}
export type noteStreams = EventUnionFromDictionary<NoteStreamTypes>;

//#endregion

//#region API event definitions
interface StreamEvents {
	'broadcast': (e: BroadcastStreams) => void;
	'internal': (e: InternalStreams) => void;
}

interface AuthenticatedStreamEvents {
	[key: UserEventName]: (e: UserStreams) => void;
	[key: mainStreamName]: (e: mainStreams) => void;
	[key: driveStreamName]: (e: driveStreams) => void;
	[key: noteStreamName]: (e: noteStreams) => void;
}

export type StreamEventEmitter = Emitter<EventEmitter, AuthenticatedStreamEvents & StreamEvents>;
//#endregion
