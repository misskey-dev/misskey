import * as mongo from 'mongodb';
import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import define from '../../../define';
import * as ms from 'ms';
import deleteReaction from '../../../../../services/note/reaction/delete';
import { IUser } from '../../../../../models/user';
import { getValiedNote } from '../../../common/getters';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿へのリアクションを取り消します。',
		'en-US': 'Unreact to a note.'
	},

	requireCredential: true,

	kind: 'reaction-write',

	limit: {
		duration: ms('1hour'),
		max: 5,
		minInterval: ms('3sec')
	},

	params: {
		noteId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象の投稿のID',
				'en-US': 'Target note ID'
			}
		},
	}
};

export default define(meta, (ps, user) => new Promise((res, rej) => {
	deleteReactionById(user, ps.noteId)
		.then(r => res(r)).catch(e => rej(e));
}));

async function deleteReactionById(user: IUser, noteId: mongo.ObjectID) {
	const note = await getValiedNote(noteId);
	await deleteReaction(user, note);
}
