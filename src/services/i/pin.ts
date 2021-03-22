import config from '../../config';
import renderAdd from '../../remote/activitypub/renderer/add';
import renderRemove from '../../remote/activitypub/renderer/remove';
import { renderActivity } from '../../remote/activitypub/renderer';
import { IdentifiableError } from '../../misc/identifiable-error';
import { User } from '../../models/entities/user';
import { Note } from '../../models/entities/note';
import { Notes, UserNotePinings, Users } from '../../models';
import { UserNotePining } from '../../models/entities/user-note-pining';
import { genId } from '../../misc/gen-id';
import { deliverToFollowers } from '../../remote/activitypub/deliver-manager';
import { deliverToRelays } from '../relay';

/**
 * 指定した投稿をピン留めします
 * @param user
 * @param noteId
 */
export async function addPinned(user: User, noteId: Note['id']) {
	// Fetch pinee
	const note = await Notes.findOne({
		id: noteId,
		userId: user.id
	});

	if (note == null) {
		throw new IdentifiableError('70c4e51f-5bea-449c-a030-53bee3cce202', 'No such note.');
	}

	const pinings = await UserNotePinings.find({ userId: user.id });

	if (pinings.length >= 5) {
		throw new IdentifiableError('15a018eb-58e5-4da1-93be-330fcc5e4e1a', 'You can not pin notes any more.');
	}

	if (pinings.some(pining => pining.noteId === note.id)) {
		throw new IdentifiableError('23f0cf4e-59a3-4276-a91d-61a5891c1514', 'That note has already been pinned.');
	}

	await UserNotePinings.insert({
		id: genId(),
		createdAt: new Date(),
		userId: user.id,
		noteId: note.id
	} as UserNotePining);

	// Deliver to remote followers
	if (Users.isLocalUser(user)) {
		deliverPinnedChange(user.id, note.id, true);
	}
}

/**
 * 指定した投稿のピン留めを解除します
 * @param user
 * @param noteId
 */
export async function removePinned(user: User, noteId: Note['id']) {
	// Fetch unpinee
	const note = await Notes.findOne({
		id: noteId,
		userId: user.id
	});

	if (note == null) {
		throw new IdentifiableError('b302d4cf-c050-400a-bbb3-be208681f40c', 'No such note.');
	}

	UserNotePinings.delete({
		userId: user.id,
		noteId: note.id
	});

	// Deliver to remote followers
	if (Users.isLocalUser(user)) {
		deliverPinnedChange(user.id, noteId, false);
	}
}

export async function deliverPinnedChange(userId: User['id'], noteId: Note['id'], isAddition: boolean) {
	const user = await Users.findOne(userId);
	if (user == null) throw new Error('user not found');

	if (!Users.isLocalUser(user)) return;

	const target = `${config.url}/users/${user.id}/collections/featured`;
	const item = `${config.url}/notes/${noteId}`;
	const content = renderActivity(isAddition ? renderAdd(user, target, item) : renderRemove(user, target, item));

	deliverToFollowers(user, content);
	deliverToRelays(user, content);
}
