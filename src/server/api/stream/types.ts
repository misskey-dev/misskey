import { User } from '@/models/entities/user';
import { EventEmitter } from 'events';
import Emitter from 'strict-event-emitter-types';
import StreamTypes from 'misskey-js/built/streaming.types';
import { Channel } from '@/models/entities/channel';
import { UserProfile } from '@/models/entities/user-profile';
import { PackedUser } from '@/models/repositories/user';

type Payload<T extends (payload: any) => void> = T extends (payload: infer P) => void ? P : never;

// https://stackoverflow.com/questions/49311989/can-i-infer-the-type-of-a-value-using-extends-keyof-type
type EventUnionFromDictionary<
	T extends object,
	U = { [K in keyof T]: { type: K; body: T[K]} }
> = U[keyof U];

export type BroadcastStream<T extends keyof StreamTypes.BroadcasrEvents> = {
	name: 'broadcast';
	type: T;
	body: Payload<StreamTypes.BroadcasrEvents[T]>;
};

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
};

// UserList userRemoved: PackedUser;

export type UserEventName = `user:${User['id']}`;
export type UserEvent = EventUnionFromDictionary<UserEventTypes>;

interface StreamEvents {
	'broadcast': <T extends keyof StreamTypes.BroadcasrEvents>(e: BroadcastStream<T>) => void;
}

interface AuthenticatedStreamEvents {
	[key: UserEventName]: (e: UserEvent) => void;
	[key: `mainStream:${User['id']}`]: (e: { type: string; body: any }) => void;
	[key: `driveStream:${User['id']}`]: (e: { type: string; body: any }) => void;
}

export type StreamEventEmitter = Emitter<EventEmitter, AuthenticatedStreamEvents & StreamEvents>;
