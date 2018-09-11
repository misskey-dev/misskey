import * as mongo from 'mongodb';
import Xev from 'xev';

const ev = new Xev();

type ID = string | mongo.ObjectID;

function publish(channel: string, type: string, value?: any): void {
	const message = type == null ? value : value == null ?
		{ type: type } :
		{ type: type, body: value };

	ev.emit(channel, message);
}

export function publishUserStream(userId: ID, type: string, value?: any): void {
	publish(`user-stream:${userId}`, type, typeof value === 'undefined' ? null : value);
}

export function publishDriveStream(userId: ID, type: string, value?: any): void {
	publish(`drive-stream:${userId}`, type, typeof value === 'undefined' ? null : value);
}

export function publishNoteStream(noteId: ID, type: string): void {
	publish(`note-stream:${noteId}`, null, noteId);
}

export function publishUserListStream(listId: ID, type: string, value?: any): void {
	publish(`user-list-stream:${listId}`, type, typeof value === 'undefined' ? null : value);
}

export function publishMessagingStream(userId: ID, otherpartyId: ID, type: string, value?: any): void {
	publish(`messaging-stream:${userId}-${otherpartyId}`, type, typeof value === 'undefined' ? null : value);
}

export function publishMessagingIndexStream(userId: ID, type: string, value?: any): void {
	publish(`messaging-index-stream:${userId}`, type, typeof value === 'undefined' ? null : value);
}

export function publishReversiStream(userId: ID, type: string, value?: any): void {
	publish(`reversi-stream:${userId}`, type, typeof value === 'undefined' ? null : value);
}

export function publishReversiGameStream(gameId: ID, type: string, value?: any): void {
	publish(`reversi-game-stream:${gameId}`, type, typeof value === 'undefined' ? null : value);
}

export function publishLocalTimelineStream(note: any): void {
	publish('local-timeline', null, note);
}

export function publishHybridTimelineStream(userId: ID, note: any): void {
	publish(userId ? `hybrid-timeline:${userId}` : 'hybrid-timeline', null, note);
}

export function publishGlobalTimelineStream(note: any): void {
	publish('global-timeline', null, note);
}
