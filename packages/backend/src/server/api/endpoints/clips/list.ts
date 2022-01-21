import define from '../../define';
import { Clips } from '@/models/index';

export const meta = {
	tags: ['clips', 'account'],

	requireCredential: true,

	kind: 'read:account',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Clip',
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
	const clips = await Clips.find({
		userId: me.id,
	});

	return await Promise.all(clips.map(x => Clips.pack(x)));
});
