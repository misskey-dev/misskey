import redis from '../db/redis';
import Xev from 'xev';
import { User } from '../models/entities/user';
import { Note } from '../models/entities/note';
import { UserList } from '../models/entities/user-list';
import { ReversiGame } from '../models/entities/games/reversi/game';

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

	public publishUserListStream = (listId: UserList['id'], type: string, value?: any): void => {
		this.publish(`userListStream:${listId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishMessagingStream = (userId: User['id'], otherpartyId: User['id'], type: string, value?: any): void => {
		this.publish(`messagingStream:${userId}-${otherpartyId}`, type, typeof value === 'undefined' ? null : value);
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

	public publishHomeTimelineStream = (userId: User['id'], note: any): void => {
		this.publish(`homeTimeline:${userId}`, null, note);
	}

	public publishLocalTimelineStream = async (note: any): Promise<void> => {
		this.publish('localTimeline', null, note);
	}

	public publishHybridTimelineStream = async (userId: User['id'], note: any): Promise<void> => {
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

	public publishAdminStream = (userId: User['id'], type: string, value?: any): void => {
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
