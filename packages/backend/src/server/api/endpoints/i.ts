import define from '../define.js';
import { Users } from '@/models/index.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'MeDetailed',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user, token) => {
	const isSecure = token == null;

	// ここで渡ってきている user はキャッシュされていて古い可能性もあるので id だけ渡す
	return await Users.pack<true, true>(user.id, user, {
		detail: true,
		includeSecrets: isSecure,
	});
});
