import define from '../define';
import { Users } from '@/models/index';

export const meta = {
	tags: ['account'],

	requireCredential: true as const,

	params: {},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		ref: 'User',
	},
};

export default define(meta, async (ps, user, token) => {
	const isSecure = token == null;

	// ここで渡ってきている user はキャッシュされていて古い可能性もあるので id だけ渡す
	return await Users.pack(user.id, user, {
		detail: true,
		includeSecrets: isSecure,
	});
});
