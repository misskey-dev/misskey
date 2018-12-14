export default function(me, settings, note) {
	const isMyNote = note.userId == me.id;
	const isPureRenote = note.renoteId != null && note.text == null && note.fileIds.length == 0 && note.poll == null;

	return settings.showMyRenotes === false && isMyNote && isPureRenote ||
		settings.showRenotedMyNotes === false && isPureRenote && note.renote.userId == me.id ||
		settings.showLocalRenotes === false && isPureRenote && note.renote.user.host == null ||
		!isMyNote && note.text && settings.mutedWords.some(q => q.length > 0 && !q.some(word => !note.text.includes(word)));
}
