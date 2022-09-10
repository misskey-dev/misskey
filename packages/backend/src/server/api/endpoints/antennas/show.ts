import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '../../error.js';
import { Antennas } from '@/models/index.js';

export const meta = {
	tags: ['antennas', 'account'],

	requireCredential: true,

	kind: 'read:account',

	errors: {
		noSuchAntenna: {
			message: 'No such antenna.',
			code: 'NO_SUCH_ANTENNA',
			id: 'c06569fb-b025-4f23-b22d-1fcd20d2816b',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Antenna',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		antennaId: { type: 'string', format: 'misskey:id' },
	},
	required: ['antennaId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('notesRepository')
    private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, me) => {
	// Fetch the antenna
	const antenna = await Antennas.findOneBy({
		id: ps.antennaId,
		userId: me.id,
	});

	if (antenna == null) {
		throw new ApiError(meta.errors.noSuchAntenna);
	}

	return await Antennas.pack(antenna);
});
