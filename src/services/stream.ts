import { redisClient } from '../db/redis';
import { User } from '../models/entities/user';
import { Note } from '../models/entities/note';
import { UserList } from '../models/entities/user-list';
import { ReversiGame } from '../models/entities/games/reversi/game';
import { UserGroup } from '../models/entities/user-group';
import config from '@/config';
import { Antenna } from '../models/entities/antenna';
import { Channel } from '../models/entities/channel';

class Publisher {
	private publish = (channel: string, type: string | null, value?: any): void => {
		const message = type == null ? value : value == null ?
			{ type: type, body: null } :
			{ type: type, body: value };

		redisClient.publish(config.host, JSON.stringify({
			channel: channel,
			message: message
		}));
	}

	public publishInternalEvent = (type: string, value?: any): void => {
		this.publish('internal', type, typeof value === 'undefined' ? null : value);
	}

	public publishUserEvent = (userId: User['id'], type: string, value?: any): void => {
		this.publish(`user:${userId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishBroadcastStream = (type: string, value?: any): void => {
		this.publish('broadcast', type, typeof value === 'undefined' ? null : value);
	}

	public publishMainStream = (userId: User['id'], type: string, value?: any): void => {
		this.publish(`mainStream:${userId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishDriveStream = (userId: User['id'], type: string, value?: any): void => {
		this.publish(`driveStream:${userId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishNoteStream = (noteId: Note['id'], type: string, value: any): void => {
		this.publish(`noteStream:${noteId}`, type, {
			id: noteId,
			body: value
		});
	}

	public publishChannelStream = (channelId: Channel['id'], type: string, value?: any): void => {
		this.publish(`channelStream:${channelId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishUserListStream = (listId: UserList['id'], type: string, value?: any): void => {
		this.publish(`userListStream:${listId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishAntennaStream = (antennaId: Antenna['id'], type: string, value?: any): void => {
		this.publish(`antennaStream:${antennaId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishMessagingStream = (userId: User['id'], otherpartyId: User['id'], type: string, value?: any): void => {
		this.publish(`messagingStream:${userId}-${otherpartyId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishGroupMessagingStream = (groupId: UserGroup['id'], type: string, value?: any): void => {
		this.publish(`messagingStream:${groupId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishMessagingIndexStream = (userId: User['id'], type: string, value?: any): void => {
		this.publish(`messagingIndexStream:${userId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishReversiStream = (userId: User['id'], type: string, value?: any): void => {
		this.publish(`reversiStream:${userId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishReversiGameStream = (gameId: ReversiGame['id'], type: string, value?: any): void => {
		this.publish(`reversiGameStream:${gameId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishNotesStream = (note: any): void => {
		this.publish('notesStream', null, note);
	}

	public publishAdminStream = (userId: User['id'], type: string, value?: any): void => {
		this.publish(`adminStream:${userId}`, type, typeof value === 'undefined' ? null : value);
	}
}

const publisher = new Publisher();

export default publisher;

export const publishInternalEvent = publisher.publishInternalEvent;
export const publishUserEvent = publisher.publishUserEvent;
export const publishBroadcastStream = publisher.publishBroadcastStream;
export const publishMainStream = publisher.publishMainStream;
export const publishDriveStream = publisher.publishDriveStream;
export const publishNoteStream = publisher.publishNoteStream;
export const publishNotesStream = publisher.publishNotesStream;
export const publishChannelStream = publisher.publishChannelStream;
export const publishUserListStream = publisher.publishUserListStream;
export const publishAntennaStream = publisher.publishAntennaStream;
export const publishMessagingStream = publisher.publishMessagingStream;
export const publishGroupMessagingStream = publisher.publishGroupMessagingStream;
export const publishMessagingIndexStream = publisher.publishMessagingIndexStream;
export const publishReversiStream = publisher.publishReversiStream;
export const publishReversiGameStream = publisher.publishReversiGameStream;
export const publishAdminStream = publisher.publishAdminStream;
