import * as mongo from 'mongodb';
import isObjectId from './is-objectid';

function toString(id: any) {
	return isObjectId(id) ? (id as mongo.ObjectID).toHexString() : id;
}

export default function(note: any, mutedUserIds: string[]): boolean {
	return (
		mutedUserIds.includes(toString(note.userId)) ||
		note.reply && mutedUserIds.includes(toString(note.reply.userId)) ||
		note.renote && mutedUserIds.includes(toString(note.renote.userId)));
}
