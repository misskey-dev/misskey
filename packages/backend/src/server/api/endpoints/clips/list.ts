import define from '../../define';
import { Clips } from '@/models/index';

export const meta = {
	tags: ['clips', 'account'],

	requireCredential: true as const,

	kind: 'read:account',

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'Clip',
		},
	},
};

export default define(meta, async (ps, me) => {
	const clips = await Clips.find({
		userId: me.id,
	});

	return await Promise.all(clips.map(x => Clips.pack(x)));
});
