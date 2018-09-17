export default function(note: any, mutedUserIds: string[]): boolean {
	if (mutedUserIds.indexOf(note.userId) != -1) {
		return true;
	}

	if (note.reply != null && mutedUserIds.indexOf(note.reply.userId) != -1) {
		return true;
	}

	if (note.renote != null && mutedUserIds.indexOf(note.renote.userId) != -1) {
		return true;
	}

	return false;
}
