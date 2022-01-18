import define from '../../define';
import { Antennas } from '@/models/index';

export const meta = {
	tags: ['antennas', 'account'],

	requireCredential: true,

	kind: 'read:account',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Antenna',
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
	const antennas = await Antennas.find({
		userId: me.id,
	});

	return await Promise.all(antennas.map(x => Antennas.pack(x)));
});
