import { IRemoteUser } from '@/models/entities/user';
import { IAdd } from '../../type';
import { resolveNote } from '../../models/note';
import { addPinned } from '@/services/i/pin';
import addClip from './clip';
import { resolveClip } from '@/remote/activitypub/models/clip';
import Resolver from '@/remote/activitypub/resolver';

export default async (actor: IRemoteUser, activity: IAdd): Promise<void> => {
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

	const clip = await resolveClip(activity.target).catch(e => null);
	if (clip) {
		const resolver = new Resolver();

		const object = await resolver.resolve(activity.object).catch(e => {
			throw e;
		});

		await addClip(resolver, actor, object, activity);
		return;
	}

	throw new Error(`unknown target: ${activity.target}`);
};
