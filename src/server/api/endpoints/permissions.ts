import define from '../define';
import { kindsList } from '../kinds';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': 'パーミッションの一覧を返します。',
		'en-US': 'Get the list of permissons.'
	},

	tags: ['meta'],

	requireCredential: false,

	params: {
	},

	res: {
		type: 'array',
		items: {
			type: 'string',
		}
	},
};

export default define(meta, async () => {
	return kindsList;
});
