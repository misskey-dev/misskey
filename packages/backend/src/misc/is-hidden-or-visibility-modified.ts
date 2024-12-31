import { MiNote } from '@/models/Note.js';
import { Packed } from './json-schema.js';

export function isMustRemove(note: Packed<'Note'>, noteVisibilityUpperLimit: MiNote['visibility'] = 'home'): boolean {
	const exceedsVisibilityLimit: Record<MiNote['visibility'], () => boolean> = {
		followers: () => note.visibility === 'specified',
		home: () => !['public', 'home'].includes(note.visibility),
		public: () => note.visibility !== 'public',
		specified: () => false, // すべて許容するので常に false を返す
	};

	if (exceedsVisibilityLimit[noteVisibilityUpperLimit]()) {
		return true;
	}

	return note.isHidden ?? false;
}
