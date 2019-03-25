import define from '../../../../define';

export const meta = {
	tags: ['games'],

	requireCredential: true
};

export default define(meta, async (ps, user) => {
	await Matching.remove({
		parentId: user.id
	});
});
