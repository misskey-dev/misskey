export function isBlockerUserRelated(note: any, blockerUserIds: Set<string>): boolean {
	if (blockerUserIds.has(note.userId)) {
		return true;
	}

	if (note.reply != null && blockerUserIds.has(note.reply.userId)) {
		return true;
	}

	if (note.renote != null && blockerUserIds.has(note.renote.userId)) {
		return true;
	}

	return false;
}
