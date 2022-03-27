import { CacheableRemoteUser } from '@/models/entities/user.js';
import { IAdd } from '../../type.js';
import { resolveNote } from '../../models/note.js';
import { addPinned } from '@/services/i/pin.js';

export default async (actor: CacheableRemoteUser, activity: IAdd): Promise<void> => {
	if ('actor' in activity && actor.uri !== activity.actor) {
		throw new Error('invalid actor');
	}

	if (activity.target == null) {
		throw new Error('target is null');
	}

	if (activity.target === actor.featured) {
		const note = await resolveNote(activity.object);
		if (note == null) throw new Error('note not found');
		await addPinned(actor, note.id);
		return;
	}

	throw new Error(`unknown target: ${activity.target}`);
};
