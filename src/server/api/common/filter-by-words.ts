import { Note } from '../../../models/entities/note';
import { MutedWord } from '../../../models/entities/muted-word';
import { User } from '../../../models/entities/user';
import { getMutedList } from './get-muted-list';

export function shouldBeFilteredTextByWords(text: string | null, mutedList: MutedWord[]) {
	// フィルタリングされるべきであれば true
	return !!text && mutedList.some(record => record.condition.every(word => text.includes(word)))
}

export function shouldBeFilteredNoteByWords(note: Note | null, mutedList: MutedWord[]) {
	return !!note && (
		shouldBeFilteredTextByWords(note.text, mutedList) ||
		shouldBeFilteredTextByWords(note.cw, mutedList) ||
		shouldBeFilteredTextByWords(note.renote ? note.renote.text : null, mutedList) ||
		shouldBeFilteredTextByWords(note.reply ? note.reply.text : null, mutedList)
	);
}

export async function filterNotesByWords(notes: Note[], user: User, mutedList?: MutedWord[]) {
	const list = mutedList || await getMutedList(user);
	return notes.filter(note =>
		// 自分の投稿はフィルターしない
		note.userId === (user ? user.id : null) ||
		!shouldBeFilteredNoteByWords(note, list)
	);
}