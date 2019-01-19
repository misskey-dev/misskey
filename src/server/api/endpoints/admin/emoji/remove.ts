import $ from 'cafy';
import Emoji from '../../../../../models/emoji';
import define from '../../../define';
import ID from '../../../../../misc/cafy-id';
import { error } from '../../../../../prelude/promise';

export const meta = {
	desc: {
		'ja-JP': 'カスタム絵文字を削除します。'
	},

	requireCredential: true,
	requireModerator: true,

	params: {
		id: {
			validator: $.type(ID)
		}
	}
};

export default define(meta, ps => Emoji.findOne({ _id: ps.id })
	.then(x =>
		!x ? error('emoji not found') :
		Emoji.remove({ _id: x._id }))
	.then(() => {}));
