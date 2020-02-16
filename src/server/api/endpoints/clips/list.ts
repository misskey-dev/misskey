import define from '../../define';
import { Clips } from '../../../../models';

export const meta = {
	tags: ['clips', 'account'],

	requireCredential: true as const,

	kind: 'read:account',
};

export default define(meta, async (ps, me) => {
	const clips = await Clips.find({
		userId: me.id,
	});

	return await Promise.all(clips.map(x => Clips.pack(x)));
});
