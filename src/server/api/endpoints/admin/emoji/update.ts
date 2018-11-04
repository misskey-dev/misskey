import $ from 'cafy';
import Emoji from '../../../../../models/emoji';
import define from '../../../define';
import ID from '../../../../../misc/cafy-id';

export const meta = {
	desc: {
		'ja-JP': 'カスタム絵文字を更新します。'
	},

	requireCredential: true,
	requireAdmin: true,

	params: {
		id: {
			validator: $.type(ID)
		},

		name: {
			validator: $.str
		},

		url: {
			validator: $.str
		},

		aliases: {
			validator: $.arr($.str)
		}
	}
};

export default define(meta, (ps) => new Promise(async (res, rej) => {
	const emoji = await Emoji.findOne({
		_id: ps.id
	});

	if (emoji == null) return rej('emoji not found');

	await Emoji.update({ _id: emoji._id }, {
		$set: {
			updatedAt: new Date(),
			name: ps.name,
			aliases: ps.aliases,
			url: ps.url
		}
	});

	res();
}));
