import { Inject, Injectable } from '@nestjs/common';
import type { Instances } from '@/models/index.js';
import type { Instance } from '@/models/entities/instance';
import { Cache } from '@/misc/cache.js';
import { genId } from '@/misc/gen-id.js';
import { toPuny } from '@/misc/convert-host.js';

@Injectable()
export class FederatedInstanceService {
	#cache: Cache<Instance>;

	constructor(
		@Inject('instancesRepository')
		private instancesRepository: typeof Instances,
	) {
		this.#cache = new Cache<Instance>(1000 * 60 * 60);
	}

	public async registerOrFetchInstanceDoc(host: string): Promise<Instance> {
		host = toPuny(host);
	
		const cached = this.#cache.get(host);
		if (cached) return cached;
	
		const index = await this.instancesRepository.findOneBy({ host });
	
		if (index == null) {
			const i = await this.instancesRepository.insert({
				id: genId(),
				host,
				caughtAt: new Date(),
				lastCommunicatedAt: new Date(),
			}).then(x => this.instancesRepository.findOneByOrFail(x.identifiers[0]));
	
			this.#cache.set(host, i);
			return i;
		} else {
			this.#cache.set(host, index);
			return index;
		}
	}
}
