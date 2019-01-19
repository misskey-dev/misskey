import $ from 'cafy';
import Emoji from '../../../../../models/emoji';
import define from '../../../define';

export const meta = {
	desc: {
		'ja-JP': 'カスタム絵文字を取得します。'
	},

	requireCredential: true,
	requireModerator: true,

	params: {
		host: {
			validator: $.str.optional.nullable,
			default: null as any
		}
	}
};

export default define(meta, ps => Emoji.find({ host: ps.host })
	.then(x => x.map(e => ({
		id: e._id,
		name: e.name,
		aliases: e.aliases,
		host: e.host,
		url: e.url
	}))));
