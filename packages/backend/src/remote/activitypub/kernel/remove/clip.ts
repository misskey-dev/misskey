import { getApId, IObject, IRemove } from '@/remote/activitypub/type';
import Resolver from '@/remote/activitypub/resolver';
import { IRemoteUser } from '@/models/entities/user';
import { getApLock } from '@/misc/app-lock';
import { fetchNote } from '@/remote/activitypub/models/note';
import { StatusError } from '@/misc/fetch';
import { ClipNotes } from '@/models';
import { fetchClip } from '@/remote/activitypub/models/clip';

export default async function(resolver: Resolver, actor: IRemoteUser, object: IObject, activity: IRemove) {
	if(!activity.target) throw new Error('No activity target');

	const noteUri = getApId(object);
	const clipUri = getApId(activity.target);

	const note = await fetchNote(object);
	if (note == null) throw new Error('note does not exist');

	const clip = await fetchClip(activity.target);
	if (clip == null) throw new Error('clip does not exist');

	if (clip.userId != actor.id) throw new Error('clip is not owned by actor');

	const unlockClip = await getApLock(clipUri);
	const unlockNote = await getApLock(noteUri)

	try {
		const exist = await ClipNotes.findOne({
			noteId: note.id,
			clipId: clip.id,
		});

		if (!exist) return 'skip: clipnote does not exist';

		await ClipNotes.delete({
			id: exist.id
		});

		return 'ok';
	} catch (e) {
		if (e instanceof StatusError && e.isClientError) {
			return `skip ${e.statusCode}`;
		} else {
			throw e;
		}
	} finally {
		unlockClip();
		unlockNote();
	}
}
