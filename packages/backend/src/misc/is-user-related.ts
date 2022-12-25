export function isUserRelated(note: any, userIds: Set<string>): boolean {
	if (userIds.has(note.userId)) {
		return true;
	}

	if (note.reply != null && userIds.has(note.reply.userId)) {
		return true;
	}

	if (note.renote != null && userIds.has(note.renote.userId)) {
		return true;
	}

	return false;
}
