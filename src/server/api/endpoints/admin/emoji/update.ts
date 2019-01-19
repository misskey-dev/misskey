import $ from 'cafy';
import Emoji from '../../../../../models/emoji';
import define from '../../../define';
import ID from '../../../../../misc/cafy-id';
import { error } from '../../../../../prelude/promise';

export const meta = {
	desc: {
		'ja-JP': 'カスタム絵文字を更新します。'
	},

	requireCredential: true,
	requireModerator: true,

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

export default define(meta, ps => Emoji.findOne({ _id: ps.id })
	.then(x =>
		!x ? error('emoji not found') :
		Emoji.update({ _id: x._id }, {
			$set: {
				updatedAt: new Date(),
				name: ps.name,
				aliases: ps.aliases,
				url: ps.url
			}
		}))
	.then(() => {}));
