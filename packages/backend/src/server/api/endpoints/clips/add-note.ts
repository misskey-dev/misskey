import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { ClipNotes, Clips } from '@/models/index';
import { ApiError } from '../../error';
import { genId } from '@/misc/gen-id';
import { getNote } from '../../common/getters';
import { renderActivity } from '@/remote/activitypub/renderer';
import renderAdd from '@/remote/activitypub/renderer/add';
import DeliverManager from '@/remote/activitypub/deliver-manager';
import { deliverToRelays } from '@/services/relay';
import config from '@/config';
import { ILocalUser } from '@/models/entities/user';

export const meta = {
	tags: ['account', 'notes', 'clips'],

	requireCredential: true,

	kind: 'write:account',

	params: {
		clipId: {
			validator: $.type(ID),
		},

		noteId: {
			validator: $.type(ID),
		},
	},

	errors: {
		noSuchClip: {
			message: 'No such clip.',
			code: 'NO_SUCH_CLIP',
			id: 'd6e76cc0-a1b5-4c7c-a287-73fa9c716dcf',
		},

		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'fc8c0b49-c7a3-4664-a0a6-b418d386bb8b',
		},

		alreadyClipped: {
			message: 'The note has already been clipped.',
			code: 'ALREADY_CLIPPED',
			id: '734806c4-542c-463a-9311-15c512803965',
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	const clip = await Clips.findOne({
		id: ps.clipId,
		userId: user.id,
	});

	if (clip == null) {
		throw new ApiError(meta.errors.noSuchClip);
	}

	const note = await getNote(ps.noteId).catch(e => {
		if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
		throw e;
	});

	const exist = await ClipNotes.findOne({
		noteId: note.id,
		clipId: clip.id,
	});

	if (exist != null) {
		throw new ApiError(meta.errors.alreadyClipped);
	}

	await ClipNotes.insert({
		id: genId(),
		noteId: note.id,
		clipId: clip.id,
	});

	if (clip.isPublic){
		(async () => {
			const clipActivity = await renderActivity(renderAdd(user as ILocalUser, `${config.url}/clips/${clip.id}`, note.uri || `${config.url}/notes/${note.id}`));
			const dm = new DeliverManager(user, clipActivity);

			dm.addFollowersRecipe();

			deliverToRelays(user, clipActivity);

			dm.execute();
		})();
	}
});
