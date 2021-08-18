import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { ApiError } from '../../error';
import { Antennas } from '../../../../models';

export const meta = {
	tags: ['antennas', 'account'],

	requireCredential: true as const,

	kind: 'read:account',

	params: {
		antennaId: {
			validator: $.type(ID),
		},
	},

	errors: {
		noSuchAntenna: {
			message: 'No such antenna.',
			code: 'NO_SUCH_ANTENNA',
			id: 'c06569fb-b025-4f23-b22d-1fcd20d2816b'
		},
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		ref: 'Antenna'
	}
};

export default define(meta, async (ps, me) => {
	// Fetch the antenna
	const antenna = await Antennas.findOne({
		id: ps.antennaId,
		userId: me.id,
	});

	if (antenna == null) {
		throw new ApiError(meta.errors.noSuchAntenna);
	}

	return await Antennas.pack(antenna);
});
