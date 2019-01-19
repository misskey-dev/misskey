import * as mongo from 'mongodb';
import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import createReaction from '../../../../../services/note/reaction/create';
import { validateReaction } from '../../../../../models/note-reaction';
import define from '../../../define';
import { IUser } from '../../../../../models/user';
import { getValiedNote } from '../../../common/getters';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定した投稿にリアクションします。',
		'en-US': 'React to a note.'
	},

	requireCredential: true,

	kind: 'reaction-write',

	params: {
		noteId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象の投稿'
			}
		},

		reaction: {
			validator: $.str.pipe(validateReaction.ok),
			desc: {
				'ja-JP': 'リアクションの種類'
			}
		}
	}
};

export default define(meta, (ps, user) => new Promise((res, rej) => {
	createReactionById(user, ps.noteId, ps.reaction)
		.then(r => res(r)).catch(e => rej(e));
}));

async function createReactionById(user: IUser, noteId: mongo.ObjectID, reaction: string) {
	const note = await getValiedNote(noteId);
	await createReaction(user, note, reaction);
}
