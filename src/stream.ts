import * as mongo from 'mongodb';
import Xev from 'xev';
import Meta, { IMeta } from './models/meta';

type ID = string | mongo.ObjectID;

class Publisher {
	private ev: Xev;
	private meta: IMeta;

	constructor() {
		this.ev = new Xev();

		setInterval(async () => {
			this.meta = await Meta.findOne({});
		}, 5000);
	}

	public getMeta = async () => {
		if (this.meta != null) return this.meta;

		this.meta = await Meta.findOne({});
		return this.meta;
	}

	private publish = (channel: string, type: string, value?: any): void => {
		const message = type == null ? value : value == null ?
			{ type: type } :
			{ type: type, body: value };

		this.ev.emit(channel, message);
	}

	public publishUserStream = (userId: ID, type: string, value?: any): void => {
		this.publish(`user-stream:${userId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishDriveStream = (userId: ID, type: string, value?: any): void => {
		this.publish(`drive-stream:${userId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishNoteStream = (noteId: ID, type: string): void => {
		this.publish(`note-stream:${noteId}`, null, noteId);
	}

	public publishUserListStream = (listId: ID, type: string, value?: any): void => {
		this.publish(`user-list-stream:${listId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishMessagingStream = (userId: ID, otherpartyId: ID, type: string, value?: any): void => {
		this.publish(`messaging-stream:${userId}-${otherpartyId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishMessagingIndexStream = (userId: ID, type: string, value?: any): void => {
		this.publish(`messaging-index-stream:${userId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishReversiStream = (userId: ID, type: string, value?: any): void => {
		this.publish(`reversi-stream:${userId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishReversiGameStream = (gameId: ID, type: string, value?: any): void => {
		this.publish(`reversi-game-stream:${gameId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishLocalTimelineStream = async (note: any): Promise<void> => {
		const meta = await this.getMeta();
		if (meta.disableLocalTimeline) return;
		this.publish('local-timeline', null, note);
	}

	public publishHybridTimelineStream = async (userId: ID, note: any): Promise<void> => {
		const meta = await this.getMeta();
		if (meta.disableLocalTimeline) return;
		this.publish(userId ? `hybrid-timeline:${userId}` : 'hybrid-timeline', null, note);
	}

	public publishGlobalTimelineStream = (note: any): void => {
		this.publish('global-timeline', null, note);
	}
}

const publisher = new Publisher();

export default publisher;

export const publishUserStream = publisher.publishUserStream;
export const publishDriveStream = publisher.publishDriveStream;
export const publishNoteStream = publisher.publishNoteStream;
export const publishUserListStream = publisher.publishUserListStream;
export const publishMessagingStream = publisher.publishMessagingStream;
export const publishMessagingIndexStream = publisher.publishMessagingIndexStream;
export const publishReversiStream = publisher.publishReversiStream;
export const publishReversiGameStream = publisher.publishReversiGameStream;
export const publishLocalTimelineStream = publisher.publishLocalTimelineStream;
export const publishHybridTimelineStream = publisher.publishHybridTimelineStream;
export const publishGlobalTimelineStream = publisher.publishGlobalTimelineStream;
