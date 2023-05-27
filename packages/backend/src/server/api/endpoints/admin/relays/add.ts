import { URL } from 'node:url';
import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { RelayService } from '@/core/RelayService.js';
import { ApiError } from '../../../error.js';

export const paramDef = {
	type: 'object',
	properties: {
		inbox: { type: 'string' },
	},
	required: ['inbox'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/relays/add'> {
	name = 'admin/relays/add' as const;
	constructor(
		private relayService: RelayService,
	) {
		super(async (ps, me) => {
			try {
				if (new URL(ps.inbox).protocol !== 'https:') throw 'https only';
			} catch {
				throw new ApiError(this.meta.errors.invalidUrl);
			}

			return await this.relayService.addRelay(ps.inbox);
		});
	}
}
