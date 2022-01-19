import { getApId, IAdd, IObject } from '@/remote/activitypub/type';
import { Clip } from '@/models/entities/clip';
import Resolver from '@/remote/activitypub/resolver';
import { IRemoteUser } from '@/models/entities/user';
import { extractDbHost } from '@/misc/convert-host';
import { getApLock } from '@/misc/app-lock';
import { resolveNote } from '@/remote/activitypub/models/note';
import { StatusError } from '@/misc/fetch';
import { ClipNotes } from '@/models';
import { resolveClip } from '@/remote/activitypub/models/clip';
import { genId } from '@/misc/gen-id';

export default async function(resolver: Resolver, actor: IRemoteUser, object: IObject, activity: IAdd) {
	if(!activity.target) throw new Error('No activity target');

	const noteUri = getApId(object);
	const clipUri = getApId(activity.target);

	const note = await resolveNote(object);
	if (note == null) throw new Error('note does not exist');

	const clip = await resolveClip(activity.target);
	if (clip == null) throw new Error('clip does not exist');

	if (clip.userId != actor.id) throw new Error('clip is not owned by actor');

	const unlockClip = await getApLock(clipUri);
	const unlockNote = await getApLock(noteUri)

	try {
		const exist = await ClipNotes.findOne({
			noteId: note.id,
			clipId: clip.id,
		});

		if (exist) throw new Error('clipnote exists');

		await ClipNotes.insert({
			id: genId(),
			noteId: note.id,
			clipId: clip.id,
		});

		return 'ok';
	} finally {
		unlockClip();
		unlockNote();
	}
}
