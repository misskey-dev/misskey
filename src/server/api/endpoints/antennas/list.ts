import define from '../../define';
import { Antennas } from '../../../../models';

export const meta = {
	tags: ['antennas', 'account'],

	requireCredential: true as const,

	kind: 'read:account',

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'Antenna'
		}
	}
};

export default define(meta, async (ps, me) => {
	const antennas = await Antennas.find({
		userId: me.id,
	});

	return await Promise.all(antennas.map(x => Antennas.pack(x)));
});
