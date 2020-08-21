export function isMutedUserRelated(note: any, mutedUserIds: string[]): boolean {
	if (mutedUserIds.includes(note.userId)) {
		return true;
	}

	if (note.reply != null && mutedUserIds.includes(note.reply.userId)) {
		return true;
	}

	if (note.renote != null && mutedUserIds.includes(note.renote.userId)) {
		return true;
	}

	return false;
}
