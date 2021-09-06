import { User } from '@/models/entities/user';
import { EventEmitter } from 'events';
import Emitter from 'strict-event-emitter-types';
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
import { UserList } from '@/models/entities/user-list';
import { MessagingMessage } from '@/models/entities/messaging-message';
import { PackedMessagingMessage } from '@/models/repositories/messaging-message';
import { UserGroup } from '@/models/entities/user-group';
import { PackedReversiGame } from '@/models/repositories/games/reversi/game';
import { PackedReversiMatching } from '@/models/repositories/games/reversi/matching';
import { ReversiGame } from '@/models/entities/games/reversi/game';
import { AbuseUserReport } from '@/models/entities/abuse-user-report';
import { PackedEmoji } from '@/models/repositories/emoji';
import StreamTypes from 'misskey-js/built/streaming.types';
import { PackedSignin } from '@/models/repositories/signin';
import { Page } from '@/models/entities/page';

// 辞書(interface or type)から{ type, body }ユニオンを定義
// https://stackoverflow.com/questions/49311989/can-i-infer-the-type-of-a-value-using-extends-keyof-type
type EventUnionFromDictionary<
	T extends object,
	U = { [K in keyof T]: { type: K; body: T[K]} }
> = U[keyof U];

// (payload: P) => void からPを取り出す
type Payload<T extends (payload: any) => void> = T extends (payload: infer P) => void ? P : never;

//#region Stream type-body definitions
export interface InternalStreamTypes {
	antennaCreated: Antenna;
	antennaDeleted: Antenna;
	antennaUpdated: Antenna;
}

export interface BroadcastTypes {
	emojiAdded: PackedEmoji;
}

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

export interface MainStreamTypes {
	notification: PackedNotification;
	mention: PackedNote;
	reply: PackedNote;
	renote: PackedNote;
	follow: PackedUser;
	followed: PackedUser;
	unfollow: PackedUser;
	meUpdated: PackedUser;
	pageEvent: {
		pageId: Page['id'];
		event: string;
		var: any;
		userId: User['id'];
		user: PackedUser;
	};
	urlUploadFinished: {
		marker?: string | null;
		file: PackedDriveFile;
	};
	readAllNotifications: undefined;
	unreadNotification: PackedNotification;
	unreadMention: Note['id'];
	readAllUnreadMentions: undefined;
	unreadSpecifiedNote: Note['id'];
	readAllUnreadSpecifiedNotes: undefined;
	readAllMessagingMessages: undefined;
	messagingMessage: PackedMessagingMessage;
	unreadMessagingMessage: PackedMessagingMessage;
	readAllAntennas: undefined;
	unreadAntenna: Antenna;
	readAllAnnouncements: undefined;
	readAllChannels: undefined;
	unreadChannel: Note['id'];
	myTokenRegenerated: undefined;
	reversiNoInvites: undefined;
	reversiInvited: PackedReversiMatching;
	signin: PackedSignin;
	registryUpdated: {
		scope?: string[];
		key: string;
		value: any | null;
	};
	driveFileCreated: PackedDriveFile;
	readAntenna: Antenna;
}

export interface DriveStreamTypes {
	fileCreated: PackedDriveFile;
	fileDeleted: DriveFile['id'];
	fileUpdated: PackedDriveFile;
	folderCreated: PackedDriveFolder;
	folderDeleted: DriveFolder['id'];
	folderUpdated: PackedDriveFolder;
}

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

export interface ChannelStreamTypes {
	typing: User['id'];
}

export interface UserListStreamTypes {
	userAdded: PackedUser;
	userRemoved: PackedUser;
}

export interface AntennaStreamTypes {
	note: Note;
}

export interface MessagingStreamTypes {
	read: MessagingMessage['id'][];
	typing: User['id'];
	message: PackedMessagingMessage;
	deleted: MessagingMessage['id'];
}

export interface GroupMessagingStreamTypes {
	read: {
		ids: MessagingMessage['id'][];
		userId: User['id'];
	};
	typing: User['id'];
	message: PackedMessagingMessage;
	deleted: MessagingMessage['id'];
}

export interface MessagingIndexStreamTypes {
	read: MessagingMessage['id'][];
	message: PackedMessagingMessage;
}

export interface ReversiStreamTypes {
	matched: PackedReversiGame;
	invited: PackedReversiMatching;
}

export interface ReversiGameStreamTypes {
	started: PackedReversiGame;
	ended: {
		winnerId: User['id'],
		game: PackedReversiGame;
	};
	updateSettings: {
		key: string;
		value: FIXME;
	};
	initForm: {
		userId: User['id'];
		form: FIXME;
	};
	updateForm: {
		userId: User['id'];
		id: string;
		value: FIXME;
	};
	message: {
		userId: User['id'];
		message: FIXME;
	};
	changeAccepts: {
		user1: boolean;
		user2: boolean;
	};
	set: {
		at: Date;
		color: boolean;
		pos: number;
		next: boolean;
	};
	watching: User['id'];
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

//#region 名前とメッセージのペアを中間生成
interface StreamMessages {
	internal: {
		name: 'internal';
		spec: EventUnionFromDictionary<InternalStreamTypes>;
	};
	broadcast: {
		name: 'broadcast';
		spec: EventUnionFromDictionary<BroadcastTypes>;
	};
	user: {
		name: `user:${User['id']}`;
		spec: EventUnionFromDictionary<UserStreamTypes>;
	};
	main: {
		name: `mainStream:${User['id']}`;
		spec: EventUnionFromDictionary<MainStreamTypes>;
	};
	drive: {
		name: `driveStream:${User['id']}`;
		spec: EventUnionFromDictionary<DriveStreamTypes>;
	};
	note: {
		name: `noteStream:${Note['id']}`;
		spec: EventUnionFromDictionary<NoteStreamTypes>;
	};
	channel: {
		name: `channelStream:${Channel['id']}`;
		spec: EventUnionFromDictionary<ChannelStreamTypes>;
	};
	userList: {
		name: `userListStream:${UserList['id']}`;
		spec: EventUnionFromDictionary<UserListStreamTypes>;
	};
	antenna: {
		name: `antennaStream:${Antenna['id']}`;
		spec: EventUnionFromDictionary<AntennaStreamTypes>;
	};
	messaging: {
		name: `messagingStream:${User['id']}-${User['id']}`;
		spec: EventUnionFromDictionary<MessagingStreamTypes>;
	};
	groupMessaging: {
		name: `messagingStream:${UserGroup['id']}`;
		spec: EventUnionFromDictionary<GroupMessagingStreamTypes>;
	};
	messagingIndex: {
		name: `messagingIndexStream:${User['id']}`;
		spec: EventUnionFromDictionary<MessagingIndexStreamTypes>;
	};
	reversi: {
		name: `reversiStream:${User['id']}`;
		spec: EventUnionFromDictionary<ReversiStreamTypes>;
	};
	reversiGame: {
		name: `reversiGameStream:${ReversiGame['id']}`;
		spec: EventUnionFromDictionary<ReversiGameStreamTypes>;
	};
	admin: {
		name: `adminStream:${User['id']}`;
		spec: EventUnionFromDictionary<AdminStreamTypes>;
	};
	// and notesStream (specにPackedNoteを突っ込むとなぜかバグる)
}
//#endregion

// API event definitions
type EventsGenerater<K extends keyof StreamMessages> = { [key in StreamMessages[K]['name']]: (e: StreamMessages[K]['spec']) => void };
type NotesStreamEvent = { notesStream: (e: PackedNote) => void };
export type StreamEventEmitter = Emitter<EventEmitter, EventsGenerater<keyof StreamMessages> & NotesStreamEvent>;

// Channel Union
type ChannelsUnionGenerater<K extends keyof StreamMessages> = StreamMessages[K]['name'];
export type Channels = ChannelsUnionGenerater<keyof StreamMessages> | 'notesStream';
