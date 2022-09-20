import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import type { User } from '@/models/entities/User.js';
import type { Note } from '@/models/entities/Note.js';
import type { UserList } from '@/models/entities/UserList.js';
import type { UserGroup } from '@/models/entities/UserGroup.js';
import type { Antenna } from '@/models/entities/Antenna.js';
import type { Channel } from '@/models/entities/Channel.js';
import type {
	StreamChannels,
	AdminStreamTypes,
	AntennaStreamTypes,
	BroadcastTypes,
	ChannelStreamTypes,
	DriveStreamTypes,
	GroupMessagingStreamTypes,
	InternalStreamTypes,
	MainStreamTypes,
	MessagingIndexStreamTypes,
	MessagingStreamTypes,
	NoteStreamTypes,
	UserListStreamTypes,
	UserStreamTypes,
} from '@/server/api/stream/types.js';
import type { Packed } from '@/misc/schema.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';

@Injectable()
export class GlobalEventService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,
	) {
	}

	private publish(channel: StreamChannels, type: string | null, value?: any): void {
		const message = type == null ? value : value == null ?
			{ type: type, body: null } :
			{ type: type, body: value };

		this.redisClient.publish(this.config.host, JSON.stringify({
			channel: channel,
			message: message,
		}));
	}

	public publishInternalEvent<K extends keyof InternalStreamTypes>(type: K, value?: InternalStreamTypes[K]): void {
		this.publish('internal', type, typeof value === 'undefined' ? null : value);
	}

	public publishUserEvent<K extends keyof UserStreamTypes>(userId: User['id'], type: K, value?: UserStreamTypes[K]): void {
		this.publish(`user:${userId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishBroadcastStream<K extends keyof BroadcastTypes>(type: K, value?: BroadcastTypes[K]): void {
		this.publish('broadcast', type, typeof value === 'undefined' ? null : value);
	}

	public publishMainStream<K extends keyof MainStreamTypes>(userId: User['id'], type: K, value?: MainStreamTypes[K]): void {
		this.publish(`mainStream:${userId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishDriveStream<K extends keyof DriveStreamTypes>(userId: User['id'], type: K, value?: DriveStreamTypes[K]): void {
		this.publish(`driveStream:${userId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishNoteStream<K extends keyof NoteStreamTypes>(noteId: Note['id'], type: K, value?: NoteStreamTypes[K]): void {
		this.publish(`noteStream:${noteId}`, type, {
			id: noteId,
			body: value,
		});
	}

	public publishChannelStream<K extends keyof ChannelStreamTypes>(channelId: Channel['id'], type: K, value?: ChannelStreamTypes[K]): void {
		this.publish(`channelStream:${channelId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishUserListStream<K extends keyof UserListStreamTypes>(listId: UserList['id'], type: K, value?: UserListStreamTypes[K]): void {
		this.publish(`userListStream:${listId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishAntennaStream<K extends keyof AntennaStreamTypes>(antennaId: Antenna['id'], type: K, value?: AntennaStreamTypes[K]): void {
		this.publish(`antennaStream:${antennaId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishMessagingStream<K extends keyof MessagingStreamTypes>(userId: User['id'], otherpartyId: User['id'], type: K, value?: MessagingStreamTypes[K]): void {
		this.publish(`messagingStream:${userId}-${otherpartyId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishGroupMessagingStream<K extends keyof GroupMessagingStreamTypes>(groupId: UserGroup['id'], type: K, value?: GroupMessagingStreamTypes[K]): void {
		this.publish(`messagingStream:${groupId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishMessagingIndexStream<K extends keyof MessagingIndexStreamTypes>(userId: User['id'], type: K, value?: MessagingIndexStreamTypes[K]): void {
		this.publish(`messagingIndexStream:${userId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishNotesStream(note: Packed<'Note'>): void {
		this.publish('notesStream', null, note);
	}

	public publishAdminStream<K extends keyof AdminStreamTypes>(userId: User['id'], type: K, value?: AdminStreamTypes[K]): void {
		this.publish(`adminStream:${userId}`, type, typeof value === 'undefined' ? null : value);
	}
}
