import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { ApiError } from '../../error';
import { Apps } from '@/models/index';

export const meta = {
	tags: ['app'],

	params: {
		appId: {
			validator: $.type(ID),
		},
	},

	errors: {
		noSuchApp: {
			message: 'No such app.',
			code: 'NO_SUCH_APP',
			id: 'dce83913-2dc6-4093-8a7b-71dbb11718a3',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'App',
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user, token) => {
	const isSecure = user != null && token == null;

	// Lookup app
	const ap = await Apps.findOne(ps.appId);

	if (ap == null) {
		throw new ApiError(meta.errors.noSuchApp);
	}

	return await Apps.pack(ap, user, {
		detail: true,
		includeSecret: isSecure && (ap.userId === user!.id),
	});
});
