import $ from 'cafy';
import Emoji from '../../../../../models/emoji';
import define from '../../../define';
import ID from '../../../../../misc/cafy-id';

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

export default define(meta, (ps) => new Promise(async (res, rej) => {
	const emoji = await Emoji.findOne({
		_id: ps.id
	});

	if (emoji == null) return rej('emoji not found');

	await Emoji.remove({ _id: emoji._id });

	res();
}));
