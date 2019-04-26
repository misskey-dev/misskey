import $ from 'cafy';
import define from '../../define';
import { ApiError } from '../../error';
import { Pages } from '../../../../models';
import { types, bool } from '../../../../misc/schema';
import { ID } from '../../../../misc/cafy-id';

export const meta = {
	desc: {
		'ja-JP': '指定したページの情報を取得します。',
	},

	tags: ['pages'],

	requireCredential: false,

	params: {
		pageId: {
			validator: $.type(ID),
			desc: {
				'ja-JP': '対象のページのID',
				'en-US': 'Target page ID.'
			}
		}
	},

	res: {
		type: types.object,
		optional: bool.false, nullable: bool.false,
		ref: 'Page',
	},

	errors: {
		noSuchPage: {
			message: 'No such page.',
			code: 'NO_SUCH_PAGE',
			id: '222120c0-3ead-4528-811b-b96f233388d7'
		}
	}
};

export default define(meta, async (ps, user) => {
	const page = await Pages.findOne(ps.pageId);
	if (page == null) {
		throw new ApiError(meta.errors.noSuchPage);
	}

	return await Pages.pack(page);
});
