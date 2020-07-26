import { Note } from '../models/entities/note';

type NoteLike = {
	text: Note['text'];
};

export async function checkWordMute(note: NoteLike, mutedWords: string[][]): Promise<boolean> {
	const words = mutedWords
		// Clean up
		.map(xs => xs.filter(x => x !== ''))
		.filter(xs => xs.length > 0);

	if (words.length > 0) {
		if (note.text == null) return false;

		const matched = words.some(and =>
			and.every(keyword =>
				note.text!.includes(keyword)
			));

		if (matched) return true;
	}

	return false;
}
