import { User } from '@/models/entities/user';
import { EventEmitter } from 'events';
import Emitter from 'strict-event-emitter-types';
import StreamTypes from 'misskey-js/built/streaming.types';
import { Channel } from '@/models/entities/channel';
import { UserProfile } from '@/models/entities/user-profile';
import { PackedUser } from '@/models/repositories/user';
import { PackedNotification } from '@/models/repositories/notification';
import { PackedNote } from '@/models/repositories/note';

type Payload<T extends (payload: any) => void> = T extends (payload: infer P) => void ? P : never;

// https://stackoverflow.com/questions/49311989/can-i-infer-the-type-of-a-value-using-extends-keyof-type
type EventUnionFromDictionary<
	T extends object,
	U = { [K in keyof T]: { type: K; body: T[K]} }
> = U[keyof U];

type EventUnionFromMkJSTypes<
	T extends { [key: string]: ((payload: any) => void) | (() => void) },
	U = { [K in keyof T]: { type: K; body: Payload<T[K]>} }
> = U[keyof U];

export type BroadcastStream = EventUnionFromMkJSTypes<StreamTypes.BroadcasrEvents>;

export interface UserEventTypes {
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
export type UserEventName = `user:${User['id']}`;
export type UserEvents = EventUnionFromDictionary<UserEventTypes>;

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
export type mainStreamName = `mainStream:${User['id']}`;
export type mainStreams = EventUnionFromDictionary<MainStreamTypes>;

interface StreamEvents {
	'broadcast': (e: BroadcastStream) => void;
}

interface AuthenticatedStreamEvents {
	[key: UserEventName]: (e: UserEvents) => void;
	[key: mainStreamName]: (e: mainStreams) => void;
	[key: `driveStream:${User['id']}`]: (e: { type: string; body: any }) => void;
}

export type StreamEventEmitter = Emitter<EventEmitter, AuthenticatedStreamEvents & StreamEvents>;
