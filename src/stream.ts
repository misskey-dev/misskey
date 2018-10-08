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
			{ type: type, body: null } :
			{ type: type, body: value };

		this.ev.emit(channel, message);
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
		const meta = await this.getMeta();
		if (meta.disableLocalTimeline) return;
		this.publish('localTimeline', null, note);
	}

	public publishHybridTimelineStream = async (userId: ID, note: any): Promise<void> => {
		const meta = await this.getMeta();
		if (meta.disableLocalTimeline) return;
		this.publish(userId ? `hybridTimeline:${userId}` : 'hybridTimeline', null, note);
	}

	public publishGlobalTimelineStream = (note: any): void => {
		this.publish('globalTimeline', null, note);
	}

	public publishHashtagStream = (note: any): void => {
		this.publish('hashtag', null, note);
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
