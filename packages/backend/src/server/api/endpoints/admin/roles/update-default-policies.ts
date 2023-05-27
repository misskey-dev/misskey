import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { MetaService } from '@/core/MetaService.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/roles/update-default-policies'> {
	name = 'admin/roles/update-default-policies' as const;
	constructor(
		private metaService: MetaService,
		private globalEventService: GlobalEventService,
	) {
		super(async (ps) => {
			await this.metaService.update({
				policies: ps.policies,
			});
			this.globalEventService.publishInternalEvent('policiesUpdated', ps.policies);
		});
	}
}
