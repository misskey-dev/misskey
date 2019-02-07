import * as mongo from 'mongodb';
import redis from '../db/redis';
import Xev from 'xev';

type ID = string | mongo.ObjectID;

class Publisher {
	private ev: Xev;

	constructor() {
		// Redisがインストールされてないときはプロセス間通信を使う
		if (redis == null) {
			this.ev = new Xev();
		}
	}

	private publish = (channel: string, type: string, value?: any): void => {
		const message = type == null ? value : value == null ?
			{ type: type, body: null } :
			{ type: type, body: value };

		if (this.ev) {
			this.ev.emit(channel, message);
		} else {
			redis.publish('misskey', JSON.stringify({
				channel: channel,
				message: message
			}));
		}
	}

	public publishMainStream = (userId: ID, type: string, value?: any): void => {
		this.publish(`mainStream:${userId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishDriveStream = (userId: ID, type: string, value?: any): void => {
		this.publish(`driveStream:${userId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishNoteStream = (noteId: ID, type: string, value: any): void => {
		this.publish(`noteStream:${noteId}`, type, {
			id: noteId,
			body: value
		});
	}

	public publishUserListStream = (listId: ID, type: string, value?: any): void => {
		this.publish(`userListStream:${listId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishMessagingStream = (userId: ID, otherpartyId: ID, type: string, value?: any): void => {
		this.publish(`messagingStream:${userId}-${otherpartyId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishMessagingIndexStream = (userId: ID, type: string, value?: any): void => {
		this.publish(`messagingIndexStream:${userId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishReversiStream = (userId: ID, type: string, value?: any): void => {
		this.publish(`reversiStream:${userId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishReversiGameStream = (gameId: ID, type: string, value?: any): void => {
		this.publish(`reversiGameStream:${gameId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishHomeTimelineStream = (userId: ID, note: any): void => {
		this.publish(`homeTimeline:${userId}`, null, note);
	}

	public publishLocalTimelineStream = async (note: any): Promise<void> => {
		this.publish('localTimeline', null, note);
	}

	public publishHybridTimelineStream = async (userId: ID, note: any): Promise<void> => {
		this.publish(userId ? `hybridTimeline:${userId}` : 'hybridTimeline', null, note);
	}

	public publishGlobalTimelineStream = (note: any): void => {
		this.publish('globalTimeline', null, note);
	}

	public publishHashtagStream = (note: any): void => {
		this.publish('hashtag', null, note);
	}

	public publishApLogStream = (log: any): void => {
		this.publish('apLog', null, log);
	}

	public publishAdminStream = (userId: ID, type: string, value?: any): void => {
		this.publish(`adminStream:${userId}`, type, typeof value === 'undefined' ? null : value);
	}
}

const publisher = new Publisher();

export default publisher;

export const publishMainStream = publisher.publishMainStream;
export const publishDriveStream = publisher.publishDriveStream;
export const publishNoteStream = publisher.publishNoteStream;
export const publishUserListStream = publisher.publishUserListStream;
export const publishMessagingStream = publisher.publishMessagingStream;
export const publishMessagingIndexStream = publisher.publishMessagingIndexStream;
export const publishReversiStream = publisher.publishReversiStream;
export const publishReversiGameStream = publisher.publishReversiGameStream;
export const publishHomeTimelineStream = publisher.publishHomeTimelineStream;
export const publishLocalTimelineStream = publisher.publishLocalTimelineStream;
export const publishHybridTimelineStream = publisher.publishHybridTimelineStream;
export const publishGlobalTimelineStream = publisher.publishGlobalTimelineStream;
export const publishHashtagStream = publisher.publishHashtagStream;
export const publishApLogStream = publisher.publishApLogStream;
export const publishAdminStream = publisher.publishAdminStream;
