export function isMutedUserRelated(note: any, mutedUserIds: Set<string>): boolean {
	if (mutedUserIds.has(note.userId)) {
		return true;
	}

	if (note.reply != null && mutedUserIds.has(note.reply.userId)) {
		return true;
	}

	if (note.renote != null && mutedUserIds.has(note.renote.userId)) {
		return true;
	}

	return false;
}
