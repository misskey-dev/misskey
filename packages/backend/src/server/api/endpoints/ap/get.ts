import { Injectable } from '@nestjs/common';
import ms from 'ms';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApResolverService } from '@/core/activitypub/ApResolverService.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'ap/get'> {
	name = 'ap/get' as const;
	constructor(
		private apResolverService: ApResolverService,
	) {
		super(async (ps, me) => {
			const resolver = this.apResolverService.createResolver();
			const object = await resolver.resolve(ps.uri);
			return object;
		});
	}
}
