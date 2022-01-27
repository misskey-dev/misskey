import { v4 as uuid } from 'uuid';
import $ from 'cafy';
import config from '@/config/index';
import define from '../../../define';
import { ApiError } from '../../../error';
import { Apps, AuthSessions } from '@/models/index';
import { genId } from '@/misc/gen-id';

export const meta = {
	tags: ['auth'],

	requireCredential: false,

	params: {
		appSecret: {
			validator: $.str,
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			token: {
				type: 'string',
				optional: false, nullable: false,
			},
			url: {
				type: 'string',
				optional: false, nullable: false,
				format: 'url',
			},
		},
	},

	errors: {
		noSuchApp: {
			message: 'No such app.',
			code: 'NO_SUCH_APP',
			id: '92f93e63-428e-4f2f-a5a4-39e1407fe998',
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps) => {
	// Lookup app
	const app = await Apps.findOne({
		secret: ps.appSecret,
	});

	if (app == null) {
		throw new ApiError(meta.errors.noSuchApp);
	}

	// Generate token
	const token = uuid();

	// Create session token document
	const doc = await AuthSessions.insert({
		id: genId(),
		createdAt: new Date(),
		appId: app.id,
		token: token,
	}).then(x => AuthSessions.findOneOrFail(x.identifiers[0]));

	return {
		token: doc.token,
		url: `${config.authUrl}/${doc.token}`,
	};
});
