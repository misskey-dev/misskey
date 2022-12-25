import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { MetaService } from '@/core/MetaService.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';

export const meta = {
	tags: ['drive', 'account'],

	requireCredential: true,

	kind: 'read:drive',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			capacity: {
				type: 'number',
				optional: false, nullable: false,
			},
			usage: {
				type: 'number',
				optional: false, nullable: false,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		private metaService: MetaService,
		private driveFileEntityService: DriveFileEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const instance = await this.metaService.fetch(true);

			// Calculate drive usage
			const usage = await this.driveFileEntityService.calcDriveUsageOf(me.id);

			return {
				capacity: 1024 * 1024 * (me.driveCapacityOverrideMb ?? instance.localDriveCapacityMb),
				usage: usage,
			};
		});
	}
}
