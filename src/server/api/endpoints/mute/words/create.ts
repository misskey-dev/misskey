import $ from 'cafy';
import define from '../../../define';
import { genId } from '../../../../../misc/gen-id';
import { MutedWords } from '../../../../../models/';

export const meta = {
	desc: {
		'ja-JP': 'ワードミュートを追加します。',
		'en-US': 'Add a muted keyword.'
	},

	tags: ['mute'],

	requireCredential: true as const,

	kind: 'write:mutes',

	params: {
		condition: {
			validator: $.arr($.str),
			desc: {
				'ja-JP': '条件となる単語の配列',
				'en-US': 'An array of words as a condition'
			}
		},
	},
};

export default define(meta, async (ps, user) => {
	const muter = user;

	MutedWords.save({
		id: genId(),
		createdAt: new Date(),
		userId: muter.id,
		condition: ps.condition,
	});
});
