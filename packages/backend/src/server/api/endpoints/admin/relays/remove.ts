import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { RelayService } from '@/core/RelayService.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/relays/remove'> {
	name = 'admin/relays/remove' as const;
	constructor(
		private relayService: RelayService,
	) {
		super(async (ps, me) => {
			return await this.relayService.removeRelay(ps.inbox);
		});
	}
}
