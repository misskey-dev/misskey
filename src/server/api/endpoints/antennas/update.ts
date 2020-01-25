import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { ApiError } from '../../error';
import { Antennas } from '../../../../models';

export const meta = {
	tags: ['antennas'],

	requireCredential: true,

	kind: 'write:account',

	params: {
		antennaId: {
			validator: $.type(ID),
		},

		name: {
			validator: $.str.range(1, 100),
		}
	},

	errors: {
		noSuchAntenna: {
			message: 'No such antenna.',
			code: 'NO_SUCH_ANTENNA',
			id: '10c673ac-8852-48eb-aa1f-f5b67f069290'
		},
	}
};

export default define(meta, async (ps, user) => {
	// Fetch the antenna
	const antenna = await Antennas.findOne({
		id: ps.antennaId,
		userId: user.id
	});

	if (antenna == null) {
		throw new ApiError(meta.errors.noSuchAntenna);
	}

	await Antennas.update(antenna.id, {
		name: ps.name
	});

	return await Antennas.pack(antenna.id);
});
