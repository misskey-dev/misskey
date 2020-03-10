import $ from 'cafy';
import { ID } from '../../../../../misc/cafy-id';
import define from '../../../define';
import { ApiError } from '../../../error';
import { MutedWords } from '../../../../../models';

export const meta = {
	desc: {
		'ja-JP': 'ワードミュートを削除します。',
		'en-US': 'Remove a muted keyword.'
	},

	tags: ['mute'],

	requireCredential: true as const,

	kind: 'write:mutes',

	params: {
		id: {
			validator: $.type(ID),
			desc: {
				'ja-JP': '対象とするレコードのID',
				'en-US': 'Target record ID'
			}
		},
	},

	errors: {
		noSuchRecord: {
			message: 'No such record.',
			code: 'NO_SUCH_RECORD',
			id: '5b3d979a-d395-4889-8cf1-d51d35a23dbb'
		},
	}
};

export default define(meta, async (ps, user) => {
	const exist = await MutedWords.findOne(ps.id);

	if (exist == null) {
		throw new ApiError(meta.errors.noSuchRecord);
	}

	// Delete mute
	await MutedWords.delete({
		id: exist.id
	});
});
