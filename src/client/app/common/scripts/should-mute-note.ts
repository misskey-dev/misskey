export default function(me, settings, note) {
	const isMyNote = note.userId == me.id;
	const isPureRenote = note.renoteId != null && note.text == null && note.fileIds.length == 0 && note.poll == null;

	if (settings.showMyRenotes === false) {
		if (isMyNote && isPureRenote) {
			return true;
		}
	}

	if (settings.showRenotedMyNotes === false) {
		if (isPureRenote && (note.renote.userId == me.id)) {
			return true;
		}
	}

	if (settings.showLocalRenotes === false) {
		if (isPureRenote && (note.renote.user.host == null)) {
			return true;
		}
	}

	if (!isMyNote && note.text && settings.mutedWords.some(q => q.length > 0 && !q.some(word => !note.text.includes(word)))) {
		return true;
	}

	return false;
}
