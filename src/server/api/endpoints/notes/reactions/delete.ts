import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import Reaction from '../../../../../models/note-reaction';
import Note from '../../../../../models/note';
import define from '../../../define';
import { publishNoteStream } from '../../../../../stream';
const ms = require('ms');

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

export default define(meta, (ps, user) => Note.findOne({ _id: ps.noteId })
	.then(async x => {
		if (x === null) throw 'note not found';
		const exist = await Reaction.findOne({
			noteId: x._id,
			userId: user._id,
			deletedAt: { $exists: false }
		});
		if (exist === null) throw 'never reacted';
		await Reaction.remove({ _id: exist._id });
		Note.update({ _id: x._id }, {
			$inc: { [`reactionCounts.${exist.reaction}`]: -1 }
		});
		publishNoteStream(x._id, 'unreacted', {
			reaction: exist.reaction,
			userId: user._id
		});
	}));
