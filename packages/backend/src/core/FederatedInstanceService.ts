import { Inject, Injectable } from '@nestjs/common';
import type { InstancesRepository } from '@/models/index.js';
import type { Instance } from '@/models/entities/Instance.js';
import { Cache } from '@/misc/cache.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';
import { UtilityService } from './UtilityService.js';

@Injectable()
export class FederatedInstanceService {
	private cache: Cache<Instance>;

	constructor(
		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		private utilityService: UtilityService,
		private idService: IdService,
	) {
		this.cache = new Cache<Instance>(1000 * 60 * 60);
	}

	public async registerOrFetchInstanceDoc(host: string): Promise<Instance> {
		host = this.utilityService.toPuny(host);
	
		const cached = this.cache.get(host);
		if (cached) return cached;
	
		const index = await this.instancesRepository.findOneBy({ host });
	
		if (index == null) {
			const i = await this.instancesRepository.insert({
				id: this.idService.genId(),
				host,
				caughtAt: new Date(),
				lastCommunicatedAt: new Date(),
			}).then(x => this.instancesRepository.findOneByOrFail(x.identifiers[0]));
	
			this.cache.set(host, i);
			return i;
		} else {
			this.cache.set(host, index);
			return index;
		}
	}
}
