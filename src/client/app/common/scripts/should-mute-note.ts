export default function(me, settings, note) {
	const isMyNote = note.userId == me.id;
	const isPureRenote = note.renoteId != null && note.text == null && note.fileIds.length == 0 && note.poll == null;

	const includesMutedWords = (text: string) =>
		text
			? settings.mutedWords.some(q => q.length > 0 && !q.some(word =>
				word.startsWith('/') && word.endsWith('/') ? !(new RegExp(word.substr(1, word.length - 2)).test(text)) : !text.includes(word)))
			: false;

	return (
		(!isMyNote && note.reply && includesMutedWords(note.reply.text)) ||
		(!isMyNote && note.renote && includesMutedWords(note.renote.text)) ||
		(settings.showMyRenotes === false && isMyNote && isPureRenote) ||
		(settings.showRenotedMyNotes === false && isPureRenote && note.renote.userId == me.id) ||
		(settings.showLocalRenotes === false && isPureRenote && note.renote.user.host == null) ||
		(!isMyNote && includesMutedWords(note.text))
	);
}
