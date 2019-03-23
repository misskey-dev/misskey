import $ from 'cafy';
import Emoji from '../../../../../models/entities/emoji';
import define from '../../../define';
import ID from '../../../../../misc/cafy-id';

export const meta = {
	desc: {
		'ja-JP': 'カスタム絵文字を削除します。'
	},

	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		id: {
			validator: $.type(StringID)
		}
	}
};

export default define(meta, async (ps) => {
	const emoji = await Emoji.findOne({
		id: ps.id
	});

	if (emoji == null) throw new Error('emoji not found');

	await Emoji.remove({ _id: emoji.id });

	return;
});
