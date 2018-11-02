import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import Reaction from '../../../../../models/note-reaction';
import Note from '../../../../../models/note';
import define from '../../../define';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿へのリアクションを取り消します。',
		'en-US': 'Unreact to a note.'
	},

	requireCredential: true,

	kind: 'reaction-write',

	params: {
		noteId: {
			validator: $.type(ID),
			transform: transform,
		},
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	// Fetch unreactee
	const note = await Note.findOne({
		_id: ps.noteId
	});

	if (note === null) {
		return rej('note not found');
	}

	// if already unreacted
	const exist = await Reaction.findOne({
		noteId: note._id,
		userId: user._id,
		deletedAt: { $exists: false }
	});

	if (exist === null) {
		return rej('never reacted');
	}

	// Delete reaction
	await Reaction.update({
		_id: exist._id
	}, {
			$set: {
				deletedAt: new Date()
			}
		});

	res();

	const dec: any = {};
	dec[`reactionCounts.${exist.reaction}`] = -1;

	// Decrement reactions count
	Note.update({ _id: note._id }, {
		$inc: dec
	});
}));
