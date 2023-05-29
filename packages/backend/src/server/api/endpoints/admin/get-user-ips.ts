import { Inject, Injectable } from '@nestjs/common';
import type { UserIpsRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/get-user-ips'> {
	name = 'admin/get-user-ips' as const;
	constructor(
		@Inject(DI.userIpsRepository)
		private userIpsRepository: UserIpsRepository,
	) {
		super(async (ps, me) => {
			const ips = await this.userIpsRepository.find({
				where: { userId: ps.userId },
				order: { createdAt: 'DESC' },
				take: 30,
			});

			return ips.map(x => ({
				ip: x.ip,
				createdAt: x.createdAt.toISOString(),
			}));
		});
	}
}
