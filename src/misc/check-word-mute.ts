import { Note } from '../models/entities/note';
import { User } from '../models/entities/user';

type NoteLike = {
	userId: Note['userId'];
	text: Note['text'];
};

type UserLike = {
	id: User['id'];
};

export async function checkWordMute(note: NoteLike, me: UserLike | null | undefined, mutedWords: string[][]): Promise<boolean> {
	// 自分自身
	if (me && (note.userId === me.id)) return false;

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
