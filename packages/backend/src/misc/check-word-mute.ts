import RE2 from 're2';
import { Note } from '@/models/entities/note.js';
import { User } from '@/models/entities/user.js';

type NoteLike = {
	userId: Note['userId'];
	text: Note['text'];
};

type UserLike = {
	id: User['id'];
};

export async function checkWordMute(note: NoteLike, me: UserLike | null | undefined, mutedWords: Array<string | string[]>): Promise<boolean> {
	// 自分自身
	if (me && (note.userId === me.id)) return false;

	if (mutedWords.length > 0) {
		if (note.text == null) return false;

		const matched = mutedWords.some(filter => {
			if (Array.isArray(filter)) {
				return filter.every(keyword => note.text!.includes(keyword));
			} else {
				// represents RegExp
				const regexp = filter.match(/^\/(.+)\/(.*)$/);

				// This should never happen due to input sanitisation.
				if (!regexp) return false;

				try {
					return new RE2(regexp[1], regexp[2]).test(note.text!);
				} catch (err) {
					// This should never happen due to input sanitisation.
					return false;
				}
			}
		});

		if (matched) return true;
	}

	return false;
}
