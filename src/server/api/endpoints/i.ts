import define from '../define';
import { RegistryItems, UserProfiles, Users } from '../../../models';
import { genId } from '../../../misc/gen-id';

export const meta = {
	desc: {
		'ja-JP': '自分のアカウント情報を取得します。'
	},

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

	// TODO: そのうち消す
	const profile = await UserProfiles.findOneOrFail(user.id);
	for (const [k, v] of Object.entries(profile.clientData)) {
		await RegistryItems.insert({
			id: genId(),
			createdAt: new Date(),
			updatedAt: new Date(),
			userId: user.id,
			domain: null,
			scope: ['client', 'base'],
			key: k,
			value: v
		});
	}
	await UserProfiles.createQueryBuilder().update()
		.set({
			clientData: {},
		})
		.where('userId = :id', { id: user.id })
		.execute();

	return await Users.pack(user, user, {
		detail: true,
		includeSecrets: isSecure
	});
});
