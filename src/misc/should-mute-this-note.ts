import * as mongo from 'mongodb';

function toString(id: any) {
	return mongo.ObjectID.prototype.isPrototypeOf(id) ? (id as mongo.ObjectID).toHexString() : id;
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
