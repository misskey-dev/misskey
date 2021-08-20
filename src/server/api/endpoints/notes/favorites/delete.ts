import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../../define';
import { ApiError } from '../../../error';
import { getNote } from '../../../common/getters';
import { NoteFavorites } from '@/models/index';

export const meta = {
	tags: ['notes', 'favorites'],

	requireCredential: true as const,

	kind: 'write:favorites',

	params: {
		noteId: {
			validator: $.type(ID),
		}
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '80848a2c-398f-4343-baa9-df1d57696c56'
		},

		notFavorited: {
			message: 'You have not marked that note a favorite.',
			code: 'NOT_FAVORITED',
			id: 'b625fc69-635e-45e9-86f4-dbefbef35af5'
		},
	}
};

export default define(meta, async (ps, user) => {
	// Get favoritee
	const note = await getNote(ps.noteId).catch(e => {
		if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
		throw e;
	});

	// if already favorited
	const exist = await NoteFavorites.findOne({
		noteId: note.id,
		userId: user.id
	});

	if (exist == null) {
		throw new ApiError(meta.errors.notFavorited);
	}

	// Delete favorite
	await NoteFavorites.delete(exist.id);
});
