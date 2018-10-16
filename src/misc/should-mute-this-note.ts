import * as mongo from 'mongodb';
import isObjectId from './is-objectid';

function toString(id: any) {
	return isObjectId(id) ? (id as mongo.ObjectID).toHexString() : id;
}

export default function(note: any, mutedUserIds: string[]): boolean {
	if (mutedUserIds.includes(toString(note.userId))) {
		return true;
	}

	if (note.reply != null && mutedUserIds.includes(toString(note.reply.userId))) {
		return true;
	}

	if (note.renote != null && mutedUserIds.includes(toString(note.renote.userId))) {
		return true;
	}

	return false;
}
